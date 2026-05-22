import { describe, expect, it } from "vitest";
import { makeDemoPhotos } from "./mockData";
import { appReducer, initialState, visiblePhotos } from "./state";

describe("app state", () => {
  it("opens a project with selected first photo", () => {
    const photos = makeDemoPhotos(3);
    const state = appReducer(initialState, { type: "open-project", projectId: "demo", photos });

    expect(state.currentProjectId).toBe("demo");
    expect(state.view).toBe("library");
    expect(state.selectedPhotoId).toBe(photos[0].id);
  });

  it("filters picks", () => {
    const photos = makeDemoPhotos(12);
    const opened = appReducer(initialState, { type: "open-project", projectId: "demo", photos });
    const filtered = appReducer(opened, { type: "set-collection", collection: "picks" });

    expect(visiblePhotos(filtered).every((photo) => photo.state === "pick")).toBe(true);
  });

  it("updates ratings without mutating other photos", () => {
    const photos = makeDemoPhotos(3);
    const opened = appReducer(initialState, { type: "open-project", projectId: "demo", photos });
    const rated = appReducer(opened, { type: "rate-photo", photoId: photos[1].id, rating: 5 });

    expect(rated.photos[1].rating).toBe(5);
    expect(rated.photos[0]).toBe(opened.photos[0]);
  });
});
