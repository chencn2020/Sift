import { describe, expect, it } from "vitest";
import type { PhotoSummary } from "../../app/types";
import { sortPhotosForCompare } from "./compareSort";

function photo(id: number, filename: string, takenAt: string): PhotoSummary {
  return {
    id,
    filename,
    takenAt,
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
    width: 0,
    height: 0,
    sizeBytes: 0,
    camera: {
      body: "",
      lens: "",
      aperture: "",
      shutter: "",
      iso: 0
    }
  };
}

describe("compare sorting", () => {
  const photos = [
    photo(1, "IMG_10.jpg", "2026-05-23 10:10:00"),
    photo(2, "IMG_2.jpg", "2026-05-23 10:02:00"),
    photo(3, "IMG_1.jpg", "2026-05-23 10:30:00")
  ];

  it("sorts by filename naturally", () => {
    expect(sortPhotosForCompare(photos, "name-asc").map((item) => item.filename)).toEqual(["IMG_1.jpg", "IMG_2.jpg", "IMG_10.jpg"]);
    expect(sortPhotosForCompare(photos, "name-desc").map((item) => item.filename)).toEqual(["IMG_10.jpg", "IMG_2.jpg", "IMG_1.jpg"]);
  });

  it("sorts by captured time", () => {
    expect(sortPhotosForCompare(photos, "time-asc").map((item) => item.id)).toEqual([2, 1, 3]);
    expect(sortPhotosForCompare(photos, "time-desc").map((item) => item.id)).toEqual([3, 1, 2]);
  });
});
