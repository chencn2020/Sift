import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeUserProfile, saveUserProfile } from "./userProfile";

describe("userProfile", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.spyOn(window, "localStorage", "get").mockReturnValue({
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      }
    } as Storage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes migrated profile data before rendering", () => {
    const profile = normalizeUserProfile({
      displayName: "\u0000 光影整理台 \n",
      username: "legacy-user",
      avatarId: "leaf",
      avatarDataUrl: "javascript:alert(1)"
    });

    expect(profile).toEqual({
      displayName: "光影整理台",
      avatarId: "camera"
    });
  });

  it("persists only safe user-facing profile fields", () => {
    const profile = saveUserProfile({
      displayName: "摄影师",
      username: "should-not-persist",
      avatarId: "camera",
      avatarDataUrl: "data:image/png;base64,aGVsbG8="
    });

    const saved = JSON.parse(window.localStorage.getItem("sift:user-profile") ?? "{}") as Record<string, unknown>;
    expect(profile).toEqual({
      displayName: "摄影师",
      avatarId: "camera",
      avatarDataUrl: "data:image/png;base64,aGVsbG8="
    });
    expect(saved).toEqual(profile);
    expect(saved.username).toBeUndefined();
  });
});
