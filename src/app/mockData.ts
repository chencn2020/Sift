import type { PersonSummary, PhotoSummary, ProjectSummary } from "./types";

export const demoProjects: ProjectSummary[] = [
  { id: "wedding-hangzhou", name: "杭州婚礼", date: "2026-05-12", total: 1247, status: "in-progress", seed: "wedding" },
  { id: "conference-shanghai", name: "上海 AI 大会", date: "2026-04-30", total: 842, status: "ready", seed: "conference" },
  { id: "portrait-studio", name: "棚拍肖像", date: "2026-04-18", total: 318, status: "ready", seed: "portrait" }
];

export const demoPeople: PersonSummary[] = [
  { id: "alice", name: "Alice", count: 142, refs: 5, color: "#62a8ff", kind: "registered" },
  { id: "bob", name: "Bob", count: 38, refs: 3, color: "#54d27b", kind: "registered" },
  { id: "carol", name: "Carol", count: 67, refs: 4, color: "#f5c451", kind: "registered" },
  { id: "cluster-1", name: "未命名 1", count: 21, refs: 0, color: "#c58cff", kind: "cluster" },
  { id: "cluster-2", name: "未命名 2", count: 18, refs: 0, color: "#ff8b8b", kind: "cluster" }
];

function hash(input: string): number {
  let value = 0;
  for (let index = 0; index < input.length; index += 1) {
    value = (value * 31 + input.charCodeAt(index)) % 100000;
  }
  return value;
}

function metric(seed: string, min = 0, max = 1): number {
  const normalized = (hash(seed) % 1000) / 1000;
  return min + normalized * (max - min);
}

export function makeDemoPhotos(count = 144): PhotoSummary[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const seed = `sift-${id}`;
    const inBurst = id >= 17 && id <= 24;
    const duplicate = id >= 58 && id <= 62;
    const sharpness = metric(`${seed}-sharp`, 0.42, 0.98);
    const people = [
      hash(`${seed}-alice`) % 4 === 0 ? "alice" : null,
      hash(`${seed}-bob`) % 8 === 0 ? "bob" : null,
      hash(`${seed}-carol`) % 6 === 0 ? "carol" : null,
      hash(`${seed}-cluster`) % 13 === 0 ? "cluster-1" : null
    ].filter((person): person is string => Boolean(person));
    const ratingSeed = hash(`${seed}-rating`) % 100;
    const rating = ratingSeed < 25 ? 0 : Math.min(5, Math.max(1, Math.floor(ratingSeed / 18)));
    const eyesClosed = hash(`${seed}-eyes`) % 100 < 12;
    const rejected = sharpness < 0.5 || eyesClosed;

    return {
      id,
      filename: `DSC_${String(1024 + id).padStart(4, "0")}.jpg`,
      takenAt: `2026-05-12 14:${String(20 + (id % 39)).padStart(2, "0")}`,
      rating,
      state: id < 5 ? "pick" : rejected && id % 3 === 0 ? "reject" : null,
      sharpness,
      exposure: metric(`${seed}-expo`, 0.58, 0.96),
      noise: metric(`${seed}-noise`, 0.55, 0.94),
      smile: metric(`${seed}-smile`, 0.08, 0.88),
      eyesClosed,
      people,
      tags: id % 9 === 0 ? ["合影"] : id % 11 === 0 ? ["抓拍"] : [],
      burstId: inBurst ? "burst-1432" : undefined,
      duplicateGroupId: duplicate ? "dup-58" : undefined,
      bestInBurst: inBurst ? metric(`${seed}-best`, 0.2, 1) : 0,
      width: 6000,
      height: 4000,
      sizeBytes: Math.round(metric(`${seed}-size`, 8, 36) * 1024 * 1024),
      camera: {
        body: "Canon EOS R5",
        lens: "RF 24-70mm F2.8L",
        aperture: "f/2.8",
        shutter: "1/320",
        iso: 800 + (hash(`${seed}-iso`) % 5) * 200
      }
    };
  });
}

export function photoGradient(photo: PhotoSummary): string {
  const hue = (photo.id * 41) % 360;
  const secondHue = (hue + 34 + photo.rating * 12) % 360;
  return `linear-gradient(135deg, hsl(${hue} 48% 36%), hsl(${secondHue} 52% 18%))`;
}
