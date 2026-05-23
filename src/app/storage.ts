import { invoke, isTauri } from "@tauri-apps/api/core";
import type { PersonSummary, ProjectSummary } from "./types";

export interface StorageInfo {
  dataDir: string;
  cacheDir: string;
  databasePath: string;
  thumbnailCacheDir: string;
  faceCacheDir: string;
}

export interface CatalogSnapshot {
  projects: ProjectSummary[];
  deletedProjects: ProjectSummary[];
  people: PersonSummary[];
}

const FALLBACK_CATALOG_KEY = "sift:catalog";

export async function resolveStorageInfo(): Promise<StorageInfo> {
  if (canUseTauri()) {
    return invoke<StorageInfo>("storage_info");
  }

  return {
    dataDir: "Browser development storage",
    cacheDir: "Browser memory / localStorage",
    databasePath: "Browser localStorage fallback",
    thumbnailCacheDir: "Browser memory thumbnails",
    faceCacheDir: "Browser localStorage face references"
  };
}

export async function initializeDatabase() {
  if (!canUseTauri()) return;
  await invoke("init_database");
}

export async function loadCatalog(): Promise<CatalogSnapshot | null> {
  if (canUseTauri()) {
    return invoke<CatalogSnapshot>("load_catalog");
  }

  try {
    const value = window.localStorage.getItem(FALLBACK_CATALOG_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<CatalogSnapshot>;
    return {
      projects: parsed.projects ?? [],
      deletedProjects: parsed.deletedProjects ?? [],
      people: parsed.people ?? []
    };
  } catch {
    return null;
  }
}

export async function persistCatalog(snapshot: CatalogSnapshot) {
  if (canUseTauri()) {
    await invoke("persist_catalog", { snapshot });
    return;
  }

  try {
    window.localStorage.setItem(FALLBACK_CATALOG_KEY, JSON.stringify(snapshot));
  } catch {
    // Browser development persistence is best-effort.
  }
}

function canUseTauri() {
  try {
    return isTauri();
  } catch {
    return false;
  }
}
