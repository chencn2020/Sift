import type { PhotoSummary } from "../../app/types";

export function getNextPhotoId(photos: PhotoSummary[], selectedPhotoId: number | null, offset: number) {
  if (!photos.length) return null;

  const currentIndex = photos.findIndex((photo) => photo.id === selectedPhotoId);
  const nextIndex = currentIndex >= 0 ? clamp(currentIndex + offset, 0, photos.length - 1) : 0;
  return photos[nextIndex]?.id ?? null;
}

export function getGridColumnCount(grid: HTMLElement | null) {
  if (!grid || typeof window === "undefined") return 1;

  const columns = window
    .getComputedStyle(grid)
    .gridTemplateColumns.trim()
    .split(/\s+/)
    .filter((column) => column && column !== "none");

  return Math.max(1, columns.length);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
