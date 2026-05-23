import type { PhotoSummary } from "../../app/types";
import { formatBytes } from "../projects/imageMetadata";

export function basicPhotoInfo(photo: PhotoSummary) {
  return [
    photo.takenAt,
    photo.width && photo.height ? `${photo.width} x ${photo.height}` : "",
    photo.sizeBytes ? formatBytes(photo.sizeBytes) : "",
    photo.format ? photo.format.toUpperCase() : ""
  ].filter(Boolean);
}

export function cameraInfo(photo: PhotoSummary) {
  return {
    body: photo.camera.body,
    lens: photo.camera.lens,
    exposure: [photo.camera.aperture, photo.camera.shutter, photo.camera.iso ? `ISO ${photo.camera.iso}` : ""].filter(Boolean).join(" · ")
  };
}
