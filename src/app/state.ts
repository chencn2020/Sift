import { demoPeople, demoProjects } from "./mockData";
import type { AppState, CollectionKey, PhotoSummary, PhotoState, ViewName } from "./types";

export type AppAction =
  | { type: "set-view"; view: ViewName }
  | { type: "set-theme"; theme: AppState["theme"] }
  | { type: "open-project"; projectId: string; photos: PhotoSummary[] }
  | { type: "select-photo"; photoId: number | null }
  | { type: "select-person"; personId: string | null }
  | { type: "set-collection"; collection: CollectionKey }
  | { type: "toggle-filter"; filter: string }
  | { type: "set-thumb-size"; size: number }
  | { type: "set-compare-layout"; layout: 2 | 4 | 9 }
  | { type: "toggle-sidebar" }
  | { type: "toggle-inspector" }
  | { type: "rate-photo"; photoId: number; rating: number }
  | { type: "flag-photo"; photoId: number; state: PhotoState }
  | { type: "set-gpu"; enabled: boolean }
  | { type: "apply-ai"; changes: Array<{ photoId: number; state: PhotoState }> };

export const initialState: AppState = {
  view: "welcome",
  theme: "dark",
  language: "cn",
  currentProjectId: null,
  selectedPhotoId: null,
  selectedPersonId: null,
  collection: "all",
  filters: [],
  thumbSize: 180,
  compareLayout: 4,
  sidebarCollapsed: false,
  inspectorCollapsed: false,
  gpuEnabled: true,
  aiRules: {
    bestOfBurst: true,
    rejectEyesClosed: true,
    rejectBlurry: true,
    rejectDuplicates: false,
    pickHighRated: false
  },
  projects: demoProjects,
  people: demoPeople,
  photos: []
};

function updatePhoto(
  photos: PhotoSummary[],
  photoId: number,
  update: (photo: PhotoSummary) => PhotoSummary
): PhotoSummary[] {
  return photos.map((photo) => (photo.id === photoId ? update(photo) : photo));
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "set-view":
      return { ...state, view: action.view };
    case "set-theme":
      return { ...state, theme: action.theme };
    case "open-project":
      return {
        ...state,
        view: "library",
        currentProjectId: action.projectId,
        photos: action.photos,
        selectedPhotoId: action.photos[0]?.id ?? null,
        collection: "all",
        filters: []
      };
    case "select-photo":
      return { ...state, selectedPhotoId: action.photoId };
    case "select-person":
      return { ...state, selectedPersonId: action.personId, collection: "all" };
    case "set-collection":
      return { ...state, collection: action.collection, selectedPersonId: null };
    case "toggle-filter": {
      const filters = state.filters.includes(action.filter)
        ? state.filters.filter((filter) => filter !== action.filter)
        : [...state.filters, action.filter];
      return { ...state, filters };
    }
    case "set-thumb-size":
      return { ...state, thumbSize: action.size };
    case "set-compare-layout":
      return { ...state, compareLayout: action.layout };
    case "toggle-sidebar":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case "toggle-inspector":
      return { ...state, inspectorCollapsed: !state.inspectorCollapsed };
    case "rate-photo":
      return {
        ...state,
        photos: updatePhoto(state.photos, action.photoId, (photo) => ({ ...photo, rating: action.rating }))
      };
    case "flag-photo":
      return {
        ...state,
        photos: updatePhoto(state.photos, action.photoId, (photo) => ({ ...photo, state: action.state }))
      };
    case "set-gpu":
      return { ...state, gpuEnabled: action.enabled };
    case "apply-ai":
      return {
        ...state,
        photos: state.photos.map((photo) => {
          const change = action.changes.find((item) => item.photoId === photo.id);
          return change ? { ...photo, state: change.state } : photo;
        })
      };
    default:
      return state;
  }
}

export function visiblePhotos(state: AppState): PhotoSummary[] {
  return state.photos.filter((photo) => {
    if (state.collection === "picks" && photo.state !== "pick") return false;
    if (state.collection === "rejects" && photo.state !== "reject") return false;
    if (state.collection === "unrated" && (photo.rating > 0 || photo.state)) return false;
    if (state.collection === "smart-sharp" && photo.sharpness < 0.72) return false;
    if (state.collection === "smart-blurry" && photo.sharpness >= 0.55) return false;
    if (state.collection === "smart-eyes-closed" && !photo.eyesClosed) return false;
    if (state.collection === "smart-best" && photo.bestInBurst < 0.7) return false;
    if (state.selectedPersonId && !photo.people.includes(state.selectedPersonId)) return false;
    if (state.filters.includes("rating") && photo.rating < 3) return false;
    if (state.filters.includes("sharp") && photo.sharpness < 0.72) return false;
    if (state.filters.includes("eyes") && photo.eyesClosed) return false;
    if (state.filters.includes("nodup") && photo.duplicateGroupId) return false;
    if (state.filters.includes("people") && photo.people.length === 0) return false;
    return true;
  });
}
