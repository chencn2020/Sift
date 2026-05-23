import { describe, expect, it } from "vitest";
import type { PhotoSummary } from "../../app/types";
import { getNextPhotoId } from "./navigation";

function photos(ids: number[]) {
  return ids.map((id) => ({ id }) as PhotoSummary);
}

describe("library navigation", () => {
  it("moves selection by offset and clamps at the visible bounds", () => {
    const visible = photos([10, 11, 12, 13]);

    expect(getNextPhotoId(visible, 11, 1)).toBe(12);
    expect(getNextPhotoId(visible, 11, -1)).toBe(10);
    expect(getNextPhotoId(visible, 13, 1)).toBe(13);
    expect(getNextPhotoId(visible, 10, -1)).toBe(10);
  });

  it("selects the first visible photo when the current selection is hidden", () => {
    expect(getNextPhotoId(photos([20, 21, 22]), 99, 1)).toBe(20);
  });
});
