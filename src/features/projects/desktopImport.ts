import { convertFileSrc, invoke, isTauri } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import type { ProjectSummary } from "../../app/types";
import { canPreviewFormat, createPhotoSummary, selectProjectCoverUrls, type DesktopPhotoFile } from "./imageMetadata";
import type { LocalImportResult } from "./localImport";
import { ensurePhotoThumbnails, thumbnailCacheKey, type ThumbnailProgress } from "./thumbnails";

interface DesktopImportPayload {
  projectName: string;
  files: DesktopPhotoFile[];
  ignoredCount: number;
}

interface DesktopDropHandlers {
  onHoverChange?: (dragging: boolean) => void;
  onDrop: (paths: string[]) => void | Promise<void>;
}

export function canUseDesktopImport() {
  try {
    return isTauri();
  } catch {
    return false;
  }
}

export async function subscribeToDesktopDrops({ onHoverChange, onDrop }: DesktopDropHandlers) {
  if (!canUseDesktopImport()) return () => undefined;

  return getCurrentWebview().onDragDropEvent((event) => {
    if (event.payload.type === "enter" || event.payload.type === "over") {
      onHoverChange?.(true);
      return;
    }

    onHoverChange?.(false);
    if (event.payload.type === "drop") {
      void onDrop(event.payload.paths);
    }
  });
}

export async function createProjectFromPaths(paths: string[], onProgress?: (progress: ThumbnailProgress) => void): Promise<LocalImportResult> {
  const payload = await invoke<DesktopImportPayload>("scan_import_paths", { paths });
  const sourcePaths = payload.files.map((file) => file.path);
  if (sourcePaths.length) await invoke("allow_source_paths", { paths: sourcePaths });
  const project = projectFromPayload(payload);
  const photos = await Promise.all(
    payload.files.map(async (file, index) => {
      const originalSrc = canPreviewFormat(file.format) ? convertFileSrc(file.path) : undefined;
      const photo = await createPhotoSummary({
        id: index + 1,
        filename: file.filename,
        relativePath: file.relativePath,
        format: file.format,
        sizeBytes: file.sizeBytes,
        modifiedMillis: file.modifiedMillis,
        src: originalSrc,
        sourcePath: file.path
      });
      return {
        ...photo,
        cacheKey: thumbnailCacheKey([file.path, file.sizeBytes, file.modifiedMillis])
      };
    })
  );
  const readyPhotos = await ensurePhotoThumbnails(photos, onProgress);

  const coverUrls = selectProjectCoverUrls(readyPhotos);
  return {
    project: {
      ...project,
      total: readyPhotos.length,
      coverUrl: coverUrls[0],
      coverUrls
    },
    photos: readyPhotos,
    ignoredCount: payload.ignoredCount
  };
}

function projectFromPayload(payload: DesktopImportPayload): ProjectSummary {
  return {
    id: `${slugify(payload.projectName)}-${Date.now()}`,
    name: payload.projectName,
    date: new Date().toLocaleDateString(),
    total: 0,
    status: "ready"
  };
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "sift-import"
  );
}
