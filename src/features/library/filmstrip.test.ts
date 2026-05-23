import { describe, expect, it } from "vitest";
import type { PhotoSummary } from "../../app/types";
import { getFilmstripWindow } from "./filmstrip";

function photos(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: index + 1 }) as PhotoSummary);
}

describe("filmstrip window", () => {
  it("keeps the selected photo inside the rendered window", () => {
    const window = getFilmstripWindow(photos(100), 70, 4);

    expect(window.map((photo) => photo.id)).toEqual([66, 67, 68, 69, 70, 71, 72, 73, 74]);
  });

  it("clamps at the start of the collection", () => {
    expect(getFilmstripWindow(photos(10), 2, 4).map((photo) => photo.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
