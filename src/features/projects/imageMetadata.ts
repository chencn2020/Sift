import type { PhotoSummary } from "../../app/types";

const BROWSER_PREVIEW_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);

export interface DesktopPhotoFile {
  path: string;
  filename: string;
  relativePath: string;
  format: string;
  sizeBytes: number;
  modifiedMillis: number;
}

interface PhotoBaseInput {
  id: number;
  filename: string;
  relativePath: string;
  format: string;
  sizeBytes: number;
  modifiedMillis: number;
  src?: string;
  sourcePath?: string;
  file?: File;
}

interface ExifMetadata {
  takenAt?: string;
  body?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: number;
  width?: number;
  height?: number;
}

export function canPreviewFormat(format: string) {
  return BROWSER_PREVIEW_EXTENSIONS.has(format.toLowerCase());
}

export function selectProjectCoverUrls(photos: PhotoSummary[], count = 4) {
  const previewPhotos = photos.filter((photo) => photo.src);
  const ratedPhotos = previewPhotos.filter((photo) => photo.rating > 0);
  const candidates = ratedPhotos.length
    ? [...ratedPhotos].sort((left, right) => right.rating - left.rating || left.id - right.id)
    : stableSpread(previewPhotos, count);

  return candidates.slice(0, count).map((photo) => photo.src).filter((src): src is string => Boolean(src));
}

export async function createPhotoSummary(input: PhotoBaseInput): Promise<PhotoSummary> {
  const exif = input.file && isJpeg(input.format) ? await readJpegExif(input.file) : {};

  return {
    id: input.id,
    filename: input.filename,
    relativePath: input.relativePath,
    format: input.format,
    src: input.src,
    originalSrc: input.src,
    sourcePath: input.sourcePath,
    takenAt: exif.takenAt ?? formatTimestamp(input.modifiedMillis),
    rating: 0,
    state: null,
    analyzed: false,
    sharpness: 0,
    exposure: 0,
    noise: 0,
    smile: 0,
    eyesClosed: false,
    people: [],
    tags: [],
    bestInBurst: 0,
    width: exif.width ?? 0,
    height: exif.height ?? 0,
    sizeBytes: input.sizeBytes,
    camera: {
      body: exif.body ?? "",
      lens: exif.lens ?? "",
      aperture: exif.aperture ?? "",
      shutter: exif.shutter ?? "",
      iso: exif.iso ?? 0
    }
  };
}

export function formatTimestamp(timestamp: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString();
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

async function readJpegExif(file: File): Promise<ExifMetadata> {
  try {
    const view = new DataView(await file.slice(0, 1024 * 512).arrayBuffer());
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {};

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      if (view.getUint8(offset) !== 0xff) return {};
      const marker = view.getUint8(offset + 1);
      const length = view.getUint16(offset + 2);
      if (marker === 0xe1 && hasExifHeader(view, offset + 4)) {
        return parseExif(view, offset + 10);
      }
      offset += 2 + length;
    }
  } catch {
    return {};
  }

  return {};
}

function parseExif(view: DataView, tiffOffset: number): ExifMetadata {
  const littleEndian = readAscii(view, tiffOffset, 2) === "II";
  const read16 = (offset: number) => view.getUint16(offset, littleEndian);
  const read32 = (offset: number) => view.getUint32(offset, littleEndian);
  if (read16(tiffOffset + 2) !== 42) return {};

  const ifd0 = readIfd(view, tiffOffset, tiffOffset + read32(tiffOffset + 4), littleEndian);
  const exifPointer = numberValue(view, tiffOffset, ifd0.get(0x8769), littleEndian);
  const exif = exifPointer ? readIfd(view, tiffOffset, tiffOffset + exifPointer, littleEndian) : new Map<number, IfdEntry>();

  const make = stringValue(view, tiffOffset, ifd0.get(0x010f), littleEndian);
  const model = stringValue(view, tiffOffset, ifd0.get(0x0110), littleEndian);
  const body = [make, model].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  const lens = stringValue(view, tiffOffset, exif.get(0xa434), littleEndian);
  const takenAt =
    normalizeExifDate(stringValue(view, tiffOffset, exif.get(0x9003), littleEndian)) ??
    normalizeExifDate(stringValue(view, tiffOffset, ifd0.get(0x0132), littleEndian));

  return {
    takenAt,
    body,
    lens,
    aperture: apertureValue(view, tiffOffset, exif.get(0x829d), littleEndian),
    shutter: shutterValue(view, tiffOffset, exif.get(0x829a), littleEndian),
    iso: numberValue(view, tiffOffset, exif.get(0x8827), littleEndian),
    width: numberValue(view, tiffOffset, exif.get(0xa002), littleEndian),
    height: numberValue(view, tiffOffset, exif.get(0xa003), littleEndian)
  };
}

interface IfdEntry {
  type: number;
  count: number;
  valueOffset: number;
  inlineOffset: number;
}

function readIfd(view: DataView, tiffOffset: number, ifdOffset: number, littleEndian: boolean) {
  const read16 = (offset: number) => view.getUint16(offset, littleEndian);
  const read32 = (offset: number) => view.getUint32(offset, littleEndian);
  const entries = new Map<number, IfdEntry>();
  if (ifdOffset <= 0 || ifdOffset + 2 > view.byteLength) return entries;

  const count = read16(ifdOffset);
  for (let index = 0; index < count; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (entryOffset + 12 > view.byteLength) break;
    entries.set(read16(entryOffset), {
      type: read16(entryOffset + 2),
      count: read32(entryOffset + 4),
      valueOffset: read32(entryOffset + 8),
      inlineOffset: entryOffset + 8
    });
  }
  return entries;
}

function stringValue(view: DataView, tiffOffset: number, entry: IfdEntry | undefined, littleEndian: boolean) {
  if (!entry || entry.type !== 2 || entry.count <= 0) return "";
  const offset = valuePosition(tiffOffset, entry, littleEndian);
  if (offset < 0 || offset >= view.byteLength) return "";
  return readAscii(view, offset, Math.min(entry.count, view.byteLength - offset)).replace(/\0+$/, "").trim();
}

function numberValue(view: DataView, tiffOffset: number, entry: IfdEntry | undefined, littleEndian: boolean) {
  if (!entry) return 0;
  const offset = valuePosition(tiffOffset, entry, littleEndian);
  if (offset < 0 || offset + 2 > view.byteLength) return 0;
  if (entry.type === 3) return view.getUint16(offset, littleEndian);
  if (entry.type === 4 && offset + 4 <= view.byteLength) return view.getUint32(offset, littleEndian);
  return 0;
}

function rationalValue(view: DataView, tiffOffset: number, entry: IfdEntry | undefined, littleEndian: boolean) {
  if (!entry || entry.type !== 5) return null;
  const offset = tiffOffset + entry.valueOffset;
  if (offset < 0 || offset + 8 > view.byteLength) return null;
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  return denominator ? numerator / denominator : null;
}

function apertureValue(view: DataView, tiffOffset: number, entry: IfdEntry | undefined, littleEndian: boolean) {
  const value = rationalValue(view, tiffOffset, entry, littleEndian);
  return value ? `f/${trimDecimal(value)}` : "";
}

function shutterValue(view: DataView, tiffOffset: number, entry: IfdEntry | undefined, littleEndian: boolean) {
  const value = rationalValue(view, tiffOffset, entry, littleEndian);
  if (!value) return "";
  if (value >= 1) return `${trimDecimal(value)}s`;
  return `1/${Math.round(1 / value)}`;
}

function valuePosition(tiffOffset: number, entry: IfdEntry, littleEndian: boolean) {
  const byteCount = entry.count * typeSize(entry.type);
  if (byteCount <= 4) return entry.inlineOffset;
  return tiffOffset + entry.valueOffset;
}

function typeSize(type: number) {
  if (type === 2 || type === 7) return 1;
  if (type === 3) return 2;
  if (type === 4 || type === 9) return 4;
  if (type === 5 || type === 10) return 8;
  return 1;
}

function hasExifHeader(view: DataView, offset: number) {
  return readAscii(view, offset, 6) === "Exif\0\0";
}

function readAscii(view: DataView, offset: number, length: number) {
  let value = "";
  for (let index = 0; index < length && offset + index < view.byteLength; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }
  return value;
}

function normalizeExifDate(value: string) {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})\s+(.*)$/);
  return match ? `${match[1]}-${match[2]}-${match[3]} ${match[4]}` : value || undefined;
}

function trimDecimal(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function isJpeg(format: string) {
  const normalized = format.toLowerCase();
  return normalized === "jpg" || normalized === "jpeg";
}

function stableSpread<T>(items: T[], count: number) {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, index) => items[Math.floor((index * (items.length - 1)) / Math.max(1, count - 1))]);
}
