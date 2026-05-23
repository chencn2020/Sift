import type { PhotoSummary, ProjectSummary } from "../../app/types";
import { canPreviewFormat, createPhotoSummary, selectProjectCoverUrls } from "./imageMetadata";
import { ensurePhotoThumbnails, thumbnailCacheKey, type ThumbnailProgress } from "./thumbnails";

const SUPPORTED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "heic",
  "heif",
  "webp",
  "gif",
  "avif",
  "cr2",
  "cr3",
  "nef",
  "arw",
  "raf",
  "orf",
  "dng"
]);

const SIFT_RELATIVE_PATH = "__siftRelativePath";

interface FileSystemEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
}

interface FileSystemFileEntryLike extends FileSystemEntryLike {
  file: (success: (file: File) => void, error?: (error: DOMException) => void) => void;
}

interface FileSystemDirectoryReaderLike {
  readEntries: (success: (entries: FileSystemEntryLike[]) => void, error?: (error: DOMException) => void) => void;
}

interface FileSystemDirectoryEntryLike extends FileSystemEntryLike {
  createReader: () => FileSystemDirectoryReaderLike;
}

export interface LocalImportResult {
  project: ProjectSummary;
  photos: PhotoSummary[];
  ignoredCount: number;
}

export async function createProjectFromFiles(inputFiles: File[], onProgress?: (progress: ThumbnailProgress) => void): Promise<LocalImportResult> {
  const allFiles = inputFiles.filter((file) => file.size > 0);
  const supportedFiles = allFiles
    .filter((file) => SUPPORTED_EXTENSIONS.has(extensionOf(file.name)))
    .sort((left, right) => pathOf(left).localeCompare(pathOf(right), undefined, { numeric: true, sensitivity: "base" }));

  const projectName = inferProjectName(supportedFiles);
  const projectId = `${slugify(projectName)}-${Date.now()}`;
  const photos = await Promise.all(supportedFiles.map((file, index) => photoFromFile(file, index + 1)));
  const readyPhotos = await ensurePhotoThumbnails(photos, onProgress);
  const coverUrls = selectProjectCoverUrls(readyPhotos);

  return {
    project: {
      id: projectId,
      name: projectName,
      date: new Date().toLocaleDateString(),
      total: readyPhotos.length,
      status: "ready",
      coverUrl: coverUrls[0],
      coverUrls
    },
    photos: readyPhotos,
    ignoredCount: allFiles.length - supportedFiles.length
  };
}

export async function filesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const entries = Array.from(dataTransfer.items)
    .map((item) => {
      if (!("webkitGetAsEntry" in item)) return null;
      return (item.webkitGetAsEntry() as unknown as FileSystemEntryLike | null) ?? null;
    })
    .filter((entry): entry is FileSystemEntryLike => Boolean(entry));

  if (!entries.length) {
    return Array.from(dataTransfer.files);
  }

  const nested = await Promise.all(entries.map((entry) => readEntry(entry)));
  return nested.flat();
}

async function photoFromFile(file: File, id: number): Promise<PhotoSummary> {
  const format = extensionOf(file.name);
  const relativePath = pathOf(file);
  return createPhotoSummary({
    id,
    filename: file.name,
    relativePath,
    format,
    sizeBytes: file.size,
    modifiedMillis: file.lastModified,
    src: canPreviewFormat(format) ? URL.createObjectURL(file) : undefined,
    sourcePath: relativePath,
    file
  }).then((photo) => ({
    ...photo,
    cacheKey: thumbnailCacheKey([relativePath, file.size, file.lastModified])
  }));
}

function readEntry(entry: FileSystemEntryLike, parentPath = ""): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve, reject) => {
      (entry as FileSystemFileEntryLike).file((file) => resolve([withRelativePath(file, joinPath(parentPath, entry.name))]), reject);
    });
  }

  if (!entry.isDirectory) return Promise.resolve([]);

  return readDirectory(entry as FileSystemDirectoryEntryLike, joinPath(parentPath, entry.name));
}

function readDirectory(entry: FileSystemDirectoryEntryLike, parentPath: string): Promise<File[]> {
  const reader = entry.createReader();
  const files: File[] = [];

  return new Promise((resolve, reject) => {
    const readBatch = () => {
      reader.readEntries(async (entries) => {
        if (!entries.length) {
          resolve(files);
          return;
        }

        try {
          const nested = await Promise.all(entries.map((child) => readEntry(child, parentPath)));
          files.push(...nested.flat());
          readBatch();
        } catch (error) {
          reject(error);
        }
      }, reject);
    };

    readBatch();
  });
}

function inferProjectName(files: File[]): string {
  const firstPath = files.find((file) => pathOf(file).includes("/"));
  if (firstPath) {
    return pathOf(firstPath).split("/")[0] || "Sift Import";
  }

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  return `Sift Import ${stamp}`;
}

function pathOf(file: File): string {
  return siftRelativePath(file) || file.webkitRelativePath || file.name;
}

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "sift-import";
}

function joinPath(parentPath: string, name: string) {
  return parentPath ? `${parentPath}/${name}` : name;
}

function withRelativePath(file: File, relativePath: string): File {
  try {
    Object.defineProperty(file, SIFT_RELATIVE_PATH, { value: relativePath, configurable: true });
  } catch {
    // Some browser File objects are sealed; falling back to file.name is acceptable.
  }
  return file;
}

function siftRelativePath(file: File) {
  return (file as File & Record<string, string | undefined>)[SIFT_RELATIVE_PATH];
}
