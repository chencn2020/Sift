import type { PhotoSummary } from "../../app/types";

export function getFilmstripWindow(photos: PhotoSummary[], selectedPhotoId: number | null, radius = 18) {
  if (!photos.length) return [];

  const selectedIndex = Math.max(
    0,
    photos.findIndex((photo) => photo.id === selectedPhotoId)
  );
  const start = Math.max(0, selectedIndex - radius);
  const end = Math.min(photos.length, selectedIndex + radius + 1);

  return photos.slice(start, end);
}
