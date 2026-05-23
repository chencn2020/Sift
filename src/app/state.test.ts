import { describe, expect, it } from "vitest";
import { appReducer, initialState, visiblePhotos } from "./state";
import type { PhotoSummary } from "./types";

function makePhotos(count = 3): PhotoSummary[] {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    filename: `photo-${index + 1}.jpg`,
    takenAt: "2026-05-23 10:00",
    rating: index % 2 === 0 ? 0 : 4,
    state: index % 3 === 0 ? "pick" : null,
    analyzed: true,
    sharpness: 0.8,
    exposure: 0.7,
    noise: 0.2,
    smile: 0.1,
    eyesClosed: false,
    people: [],
    tags: [],
    bestInBurst: 0,
    width: 4000,
    height: 3000,
    sizeBytes: 1024,
    camera: {
      body: "",
      lens: "",
      aperture: "",
      shutter: "",
      iso: 0
    }
  }));
}

describe("app state", () => {
  it("opens a project with selected first photo", () => {
    const photos = makePhotos(3);
    const state = appReducer(initialState, { type: "open-project", projectId: "project", photos });

    expect(state.currentProjectId).toBe("project");
    expect(state.view).toBe("library");
    expect(state.selectedPhotoId).toBe(photos[0].id);
  });

  it("marks imported and opened projects with the latest open time", () => {
    const photos = makePhotos(2);
    const imported = appReducer(initialState, {
      type: "import-project",
      project: { id: "project", name: "Event", date: "2026-05-23", total: photos.length, status: "ready" },
      photos
    });
    const firstOpenedAt = imported.projects[0].lastOpenedAt;
    const stale = {
      ...imported,
      projects: [{ ...imported.projects[0], lastOpenedAt: "2026-05-20T00:00:00.000Z" }]
    };
    const opened = appReducer(stale, { type: "open-project", projectId: "project", photos });

    expect(firstOpenedAt).toBeTruthy();
    expect(opened.projects[0].lastOpenedAt).not.toBe("2026-05-20T00:00:00.000Z");
  });

  it("filters picks", () => {
    const photos = makePhotos(12);
    const opened = appReducer(initialState, { type: "open-project", projectId: "project", photos });
    const filtered = appReducer(opened, { type: "set-collection", collection: "picks" });

    expect(visiblePhotos(filtered).every((photo) => photo.state === "pick")).toBe(true);
  });

  it("updates ratings without mutating other photos", () => {
    const photos = makePhotos(3);
    const opened = appReducer(initialState, { type: "open-project", projectId: "project", photos });
    const rated = appReducer(opened, { type: "rate-photo", photoId: photos[1].id, rating: 5 });

    expect(rated.photos[1].rating).toBe(5);
    expect(rated.photos[0]).toBe(opened.photos[0]);
  });

  it("renames imported projects", () => {
    const photos = makePhotos(2);
    const imported = appReducer(initialState, {
      type: "import-project",
      project: { id: "project", name: "Original", date: "2026-05-23", total: photos.length, status: "ready" },
      photos
    });
    const renamed = appReducer(imported, { type: "rename-project", projectId: "project", name: "Updated" });

    expect(renamed.projects[0].name).toBe("Updated");
    expect(renamed.currentProjectId).toBe("project");
  });

  it("updates project pin and rating", () => {
    const photos = makePhotos(2);
    const imported = appReducer(initialState, {
      type: "import-project",
      project: { id: "project", name: "Event", date: "2026-05-23", total: photos.length, status: "ready" },
      photos
    });
    const pinned = appReducer(imported, { type: "toggle-project-pin", projectId: "project" });
    const rated = appReducer(pinned, { type: "rate-project", projectId: "project", rating: 4 });

    expect(rated.projects[0].pinned).toBe(true);
    expect(rated.projects[0].rating).toBe(4);
  });

  it("deletes the current project and returns home", () => {
    const photos = makePhotos(2);
    const imported = appReducer(initialState, {
      type: "import-project",
      project: { id: "project", name: "Event", date: "2026-05-23", total: photos.length, status: "ready" },
      photos
    });
    const deleted = appReducer(imported, { type: "delete-project", projectId: "project" });

    expect(deleted.projects).toHaveLength(0);
    expect(deleted.deletedProjects).toHaveLength(1);
    expect(deleted.currentProjectId).toBeNull();
    expect(deleted.photos).toHaveLength(0);
    expect(deleted.view).toBe("welcome");
  });

  it("restores and purges recently deleted projects", () => {
    const photos = makePhotos(2);
    const imported = appReducer(initialState, {
      type: "import-project",
      project: { id: "project", name: "Event", date: "2026-05-23", total: photos.length, status: "ready" },
      photos
    });
    const deleted = appReducer(imported, { type: "delete-project", projectId: "project" });
    const restored = appReducer(deleted, { type: "restore-project", projectId: "project" });
    const deletedAgain = appReducer(restored, { type: "delete-project", projectId: "project" });
    const purged = appReducer(deletedAgain, { type: "purge-project", projectId: "project" });

    expect(restored.projects).toHaveLength(1);
    expect(restored.deletedProjects).toHaveLength(0);
    expect(purged.deletedProjects).toHaveLength(0);
  });
});
