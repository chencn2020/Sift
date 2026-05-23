import type { CompareSort, PhotoSummary } from "../../app/types";

const filenameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base"
});

export function sortPhotosForCompare(photos: PhotoSummary[], sort: CompareSort): PhotoSummary[] {
  return [...photos].sort((left, right) => comparePhotos(left, right, sort));
}

function comparePhotos(left: PhotoSummary, right: PhotoSummary, sort: CompareSort) {
  if (sort === "name-asc") return compareByName(left, right);
  if (sort === "name-desc") return compareByName(right, left);
  if (sort === "time-asc") return compareByTime(left, right) || compareByName(left, right);
  return compareByTime(right, left) || compareByName(left, right);
}

function compareByName(left: PhotoSummary, right: PhotoSummary) {
  return filenameCollator.compare(left.filename, right.filename) || left.id - right.id;
}

function compareByTime(left: PhotoSummary, right: PhotoSummary) {
  const leftTime = timestampValue(left.takenAt);
  const rightTime = timestampValue(right.takenAt);

  if (leftTime === null && rightTime === null) return 0;
  if (leftTime === null) return 1;
  if (rightTime === null) return -1;
  return leftTime - rightTime;
}

function timestampValue(value: string) {
  if (!value) return null;

  const normalized = value.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3").replace(" ", "T");
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
