import type { UserProfile } from "./types";

export const DEFAULT_AVATARS = [
  { id: "camera", label: "Camera", src: "/avatars/sift-avatar-camera-light.webp", colors: ["#0a84ff", "#30d158"], mark: "S" },
  { id: "loupe-lens", label: "Loupe", src: "/avatars/sift-avatar-loupe-lens-light.webp", colors: ["#64d2ff", "#0a84ff"], mark: "L" },
  { id: "contact-sheet", label: "Contact", src: "/avatars/sift-avatar-contact-sheet-light.webp", colors: ["#0a84ff", "#ff453a"], mark: "C" },
  { id: "memory-card", label: "Card", src: "/avatars/sift-avatar-memory-card-light.webp", colors: ["#0a84ff", "#8e8e93"], mark: "M" },
  { id: "film-sorter", label: "Film", src: "/avatars/sift-avatar-film-sorter-light.webp", colors: ["#30d158", "#ff453a"], mark: "F" },
  { id: "flash", label: "Flash", src: "/avatars/sift-avatar-flash-light.webp", colors: ["#ffd60a", "#0a84ff"], mark: "P" },
  { id: "rating-star", label: "Rating", src: "/avatars/sift-avatar-rating-star-light.webp", colors: ["#ffd60a", "#30d158"], mark: "R" },
  { id: "ai-chip", label: "AI", src: "/avatars/sift-avatar-ai-chip-light.webp", colors: ["#0a84ff", "#30d158"], mark: "A" },
  { id: "folder", label: "Folder", src: "/avatars/sift-avatar-folder-light.webp", colors: ["#0a84ff", "#2c2c2e"], mark: "D" },
  { id: "crop-loupe", label: "Crop", src: "/avatars/sift-avatar-crop-loupe-light.webp", colors: ["#0a84ff", "#30d158"], mark: "Z" }
] as const;

const DEFAULT_NICKNAMES = ["本地暗房", "快选工作台", "活动筛片台", "光影整理台", "Sift Studio"];
const STORAGE_KEY = "sift:user-profile";
const MAX_DISPLAY_NAME_LENGTH = 32;
const MAX_AVATAR_DATA_URL_LENGTH = 512_000;
const AVATAR_DATA_URL_PATTERN = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i;

export function loadUserProfile(): UserProfile {
  const saved = readSavedProfile();
  if (saved) return saveUserProfile(saved);

  const profile = createDefaultUserProfile();
  saveUserProfile(profile);
  return profile;
}

export function saveUserProfile(profile: UserProfile): UserProfile {
  const normalized = normalizeUserProfile(profile);
  const storage = getLocalStorage();
  if (!storage) return normalized;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        displayName: normalized.displayName,
        avatarId: normalized.avatarId,
        avatarDataUrl: normalized.avatarDataUrl
      })
    );
  } catch {
    // Persistence is best-effort in tests and restricted browser contexts.
  }
  return normalized;
}

export function clearUserProfileStorage() {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort recovery path for corrupted local profile data.
  }
}

export function avatarFor(profile: UserProfile) {
  return DEFAULT_AVATARS.find((avatar) => avatar.id === profile.avatarId) ?? DEFAULT_AVATARS[0];
}

export function createDefaultUserProfile(): UserProfile {
  const avatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  const displayName = DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)];
  return {
    displayName,
    avatarId: avatar.id
  };
}

export function normalizeUserProfile(profile: unknown): UserProfile {
  const source = isRecord(profile) ? profile : {};
  const displayName = sanitizeDisplayName(source.displayName) ?? DEFAULT_NICKNAMES[0];
  const avatarId = sanitizeAvatarId(source.avatarId);
  const avatarDataUrl = sanitizeAvatarDataUrl(source.avatarDataUrl);
  return {
    displayName,
    avatarId,
    ...(avatarDataUrl ? { avatarDataUrl } : {})
  };
}

function hasDefaultAvatarId(avatarId: string) {
  return DEFAULT_AVATARS.some((avatar) => avatar.id === avatarId);
}

function readSavedProfile(): UserProfile | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    const value = storage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as unknown;
    if (!isRecord(parsed) || !sanitizeDisplayName(parsed.displayName)) return null;
    return normalizeUserProfile(parsed);
  } catch {
    return null;
  }
}

function sanitizeDisplayName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return Array.from(cleaned).slice(0, MAX_DISPLAY_NAME_LENGTH).join("");
}

function sanitizeAvatarId(value: unknown) {
  if (typeof value === "string" && hasDefaultAvatarId(value)) return value;
  return DEFAULT_AVATARS[0].id;
}

function sanitizeAvatarDataUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  if (value.length > MAX_AVATAR_DATA_URL_LENGTH) return undefined;
  if (!AVATAR_DATA_URL_PATTERN.test(value)) return undefined;
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getLocalStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage as Partial<Storage> | undefined;
    if (
      typeof storage?.getItem !== "function" ||
      typeof storage.setItem !== "function" ||
      typeof storage.removeItem !== "function"
    ) {
      return null;
    }
    return storage as Pick<Storage, "getItem" | "setItem" | "removeItem">;
  } catch {
    return null;
  }
}
