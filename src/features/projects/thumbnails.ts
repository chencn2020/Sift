import { convertFileSrc, invoke, isTauri } from "@tauri-apps/api/core";
import type { PhotoSummary } from "../../app/types";

interface ThumbnailCacheResult {
  path: string;
}

interface ThumbnailBuildResult {
  dataUrl: string;
  width: number;
  height: number;
}

export interface ThumbnailProgress {
  current: number;
  total: number;
  label: string;
}

export function thumbnailCacheKey(parts: Array<string | number | undefined>) {
  return parts.filter((part) => part !== undefined && part !== "").join("::");
}

export async function ensurePhotoThumbnails(
  photos: PhotoSummary[],
  onProgress?: (progress: ThumbnailProgress) => void
): Promise<PhotoSummary[]> {
  const result = [...photos];
  const pending = photos
    .map((photo, index) => ({ photo, index }))
    .filter(({ photo }) => needsThumbnail(photo));
  let completed = 0;

  if (!pending.length) return result;
  onProgress?.({ current: 0, total: pending.length, label: pending[0]?.photo.filename ?? "" });

  await runWithConcurrency(pending, thumbnailWorkerCount(), async ({ photo, index }) => {
    result[index] = await ensurePhotoThumbnail(photo);
    completed += 1;
    onProgress?.({ current: completed, total: pending.length, label: photo.filename });
  });

  return result;
}

export async function hydrateCachedThumbnails(photos: PhotoSummary[]): Promise<PhotoSummary[]> {
  if (!canUseTauri()) return photos;
  const result = [...photos];
  const pending = photos
    .map((photo, index) => ({ photo, index }))
    .filter(({ photo }) => needsThumbnail(photo) && photo.cacheKey);

  await runWithConcurrency(pending, thumbnailWorkerCount(), async ({ photo, index }) => {
    const cached = await cachedThumbnail(photo.cacheKey ?? "");
    if (cached) result[index] = withThumbnail(photo, cached.src, photo.cacheKey ?? "", cached.path);
  });

  return result;
}

export async function ensurePhotoThumbnail(photo: PhotoSummary): Promise<PhotoSummary> {
  if (!needsThumbnail(photo)) return photo;

  const originalSrc = photo.originalSrc ?? photo.src;
  if (!originalSrc) return photo;

  const cacheKey = photo.cacheKey ?? thumbnailCacheKey([photo.sourcePath, photo.relativePath, photo.filename, photo.sizeBytes]);
  if (canUseTauri() && cacheKey) {
    const cached = await cachedThumbnail(cacheKey);
    if (cached) return withThumbnail(photo, cached.src, cacheKey, cached.path);
  }

  const thumbnail = await createThumbnailDataUrl(originalSrc).catch<ThumbnailBuildResult | null>(() => null);
  if (!thumbnail?.dataUrl) return photo;
  const withDimensions = {
    ...photo,
    width: photo.width || thumbnail.width,
    height: photo.height || thumbnail.height
  };
  if (canUseTauri() && cacheKey) {
    const saved = thumbnail.dataUrl.startsWith("data:") ? await saveThumbnail(cacheKey, thumbnail.dataUrl) : null;
    if (saved) return withThumbnail(withDimensions, saved.src, cacheKey, saved.path);
  }

  return withThumbnail(withDimensions, thumbnail.dataUrl, cacheKey);
}

export function needsThumbnail(photo: PhotoSummary) {
  if (!photo.thumbSrc) return true;
  if (photo.originalSrc && photo.thumbSrc === photo.originalSrc) return true;
  if (photo.originalSrc && photo.src === photo.originalSrc) return true;
  return false;
}

export function countPhotosNeedingThumbnails(photos: PhotoSummary[]) {
  return photos.filter(needsThumbnail).length;
}

export async function createThumbnailDataUrl(src: string, maxSize = 640): Promise<ThumbnailBuildResult> {
  const bitmap = await withTimeout(loadBitmap(src), 8000).catch(() => null);
  if (bitmap) {
    try {
      return await renderBitmap(bitmap, maxSize);
    } finally {
      bitmap.close();
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = window.setTimeout(() => {
      image.src = "";
      reject(new Error("thumbnail decode timed out"));
    }, 8000);
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      window.clearTimeout(timer);
      try {
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          resolve({ dataUrl: src, width: image.naturalWidth, height: image.naturalHeight });
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.76), width: image.naturalWidth, height: image.naturalHeight });
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                dataUrl: typeof reader.result === "string" ? reader.result : canvas.toDataURL("image/jpeg", 0.76),
                width: image.naturalWidth,
                height: image.naturalHeight
              });
            };
            reader.onerror = () => resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.76), width: image.naturalWidth, height: image.naturalHeight });
            reader.readAsDataURL(blob);
          },
          "image/jpeg",
          0.76
        );
      } catch {
        resolve({ dataUrl: src, width: image.naturalWidth, height: image.naturalHeight });
      }
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("thumbnail decode failed"));
    };
    image.src = src;
  });
}

export async function clearPersistentThumbnailCache() {
  if (!canUseTauri()) return;
  await invoke("clear_thumbnail_cache");
}

export async function allowOriginalPaths(photos: PhotoSummary[]) {
  if (!canUseTauri()) return;
  const paths = photos.map((photo) => photo.sourcePath).filter((path): path is string => Boolean(path));
  if (!paths.length) return;
  await invoke("allow_source_paths", { paths });
}

function withThumbnail(photo: PhotoSummary, thumbSrc: string, cacheKey: string, thumbnailPath?: string): PhotoSummary {
  return {
    ...photo,
    originalSrc: photo.originalSrc ?? photo.src,
    thumbSrc,
    thumbnailPath: thumbnailPath ?? photo.thumbnailPath,
    cacheKey,
    src: thumbSrc
  };
}

async function loadBitmap(src: string) {
  if (typeof fetch !== "function" || typeof createImageBitmap !== "function") return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(src, { signal: controller.signal });
    if (!response.ok) return null;
    const blob = await response.blob();
    return createImageBitmap(blob);
  } finally {
    window.clearTimeout(timeout);
  }
}

async function renderBitmap(bitmap: ImageBitmap, maxSize: number): Promise<ThumbnailBuildResult> {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return { dataUrl: "", width: bitmap.width, height: bitmap.height };
  context.drawImage(bitmap, 0, 0, width, height);
  return {
    dataUrl: await canvasToDataUrl(canvas),
    width: bitmap.width,
    height: bitmap.height
  };
}

function canvasToDataUrl(canvas: HTMLCanvasElement) {
  return new Promise<string>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(canvas.toDataURL("image/jpeg", 0.76));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : canvas.toDataURL("image/jpeg", 0.76));
        reader.onerror = () => resolve(canvas.toDataURL("image/jpeg", 0.76));
        reader.readAsDataURL(blob);
      },
      "image/jpeg",
      0.76
    );
  });
}

async function runWithConcurrency<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
      await yieldToBrowser();
    }
  });
  await Promise.all(workers);
}

function thumbnailWorkerCount() {
  if (typeof navigator === "undefined") return 2;
  const cores = navigator.hardwareConcurrency || 4;
  return Math.max(2, Math.min(4, Math.floor(cores / 2)));
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    window.setTimeout(resolve, 0);
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("operation timed out")), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function cachedThumbnail(cacheKey: string) {
  try {
    const result = await invoke<ThumbnailCacheResult | null>("cached_thumbnail_path", { cacheKey });
    return result?.path ? { src: convertFileSrc(result.path), path: result.path } : null;
  } catch {
    return null;
  }
}

async function saveThumbnail(cacheKey: string, dataUrl: string) {
  try {
    const result = await invoke<ThumbnailCacheResult>("save_thumbnail_data_url", { cacheKey, dataUrl });
    return { src: convertFileSrc(result.path), path: result.path };
  } catch {
    return null;
  }
}

function canUseTauri() {
  try {
    return isTauri();
  } catch {
    return false;
  }
}
