import type { AppState, CollectionKey, PhotoSummary, PhotoState, ViewName } from "./types";
import { loadUserProfile } from "./userProfile";

export type AppAction =
  | { type: "set-view"; view: ViewName }
  | { type: "set-theme"; theme: AppState["theme"] }
  | { type: "set-language"; language: AppState["language"] }
  | { type: "load-catalog"; projects: AppState["projects"]; deletedProjects?: AppState["deletedProjects"]; people?: AppState["people"] }
  | { type: "open-project"; projectId: string; photos: PhotoSummary[] }
  | { type: "import-project"; project: AppState["projects"][number]; photos: PhotoSummary[] }
  | { type: "replace-project-photos"; projectId: string; photos: PhotoSummary[] }
  | { type: "rename-project"; projectId: string; name: string }
  | { type: "toggle-project-pin"; projectId: string }
  | { type: "rate-project"; projectId: string; rating: number }
  | { type: "delete-project"; projectId: string }
  | { type: "select-photo"; photoId: number | null }
  | { type: "select-person"; personId: string | null }
  | { type: "set-collection"; collection: CollectionKey }
  | { type: "toggle-filter"; filter: string }
  | { type: "set-thumb-size"; size: number }
  | { type: "set-compare-layout"; layout: 2 | 4 | 9 }
  | { type: "set-compare-sort"; sort: AppState["compareSort"] }
  | { type: "toggle-sidebar" }
  | { type: "toggle-inspector" }
  | { type: "rate-photo"; photoId: number; rating: number }
  | { type: "flag-photo"; photoId: number; state: PhotoState }
  | { type: "set-gpu"; enabled: boolean }
  | { type: "update-user"; user: AppState["user"] }
  | { type: "register-person"; person: AppState["people"][number] }
  | { type: "rename-person"; personId: string; name: string }
  | { type: "delete-person"; personId: string }
  | { type: "set-ai-rule"; rule: keyof AppState["aiRules"]; enabled: boolean }
  | { type: "apply-ai"; changes: Array<{ photoId: number; state: PhotoState }> }
  | { type: "restore-project"; projectId: string }
  | { type: "purge-project"; projectId: string }
  | { type: "empty-trash" }
  | { type: "invalidate-thumbnails" };

export const initialState: AppState = {
  view: "welcome",
  theme: "system",
  language: "cn",
  currentProjectId: null,
  selectedPhotoId: null,
  selectedPersonId: null,
  collection: "all",
  filters: [],
  thumbSize: 180,
  compareLayout: 4,
  compareSort: "name-asc",
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
  projects: [],
  deletedProjects: [],
  people: [],
  photos: [],
  user: loadUserProfile()
};

function updatePhoto(
  photos: PhotoSummary[],
  photoId: number,
  update: (photo: PhotoSummary) => PhotoSummary
): PhotoSummary[] {
  return photos.map((photo) => (photo.id === photoId ? update(photo) : photo));
}

function syncCurrentProjectPhotos(state: AppState, photos: PhotoSummary[]): AppState["projects"] {
  if (!state.currentProjectId) return state.projects;
  const coverUrls = selectProjectCoverUrls(photos);
  return state.projects.map((project) =>
    project.id === state.currentProjectId
      ? { ...project, photos, coverUrl: coverUrls[0] ?? project.coverUrl, coverUrls }
      : project
  );
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "set-view":
      return { ...state, view: action.view };
    case "set-theme":
      return { ...state, theme: action.theme };
    case "set-language":
      return { ...state, language: action.language };
    case "load-catalog":
      return {
        ...state,
        projects: action.projects,
        deletedProjects: action.deletedProjects ?? [],
        people: action.people ?? state.people
      };
    case "open-project":
      return {
        ...state,
        view: "library",
        currentProjectId: action.projectId,
        photos: action.photos,
        selectedPhotoId: action.photos[0]?.id ?? null,
        collection: "all",
        filters: [],
        projects: state.projects.map((project) =>
          project.id === action.projectId ? { ...project, photos: action.photos, lastOpenedAt: new Date().toISOString() } : project
        )
      };
    case "import-project":
      return {
        ...state,
        view: "library",
        currentProjectId: action.project.id,
        selectedPhotoId: action.photos[0]?.id ?? null,
        collection: "all",
        filters: [],
        photos: action.photos,
        projects: [
          { ...action.project, photos: action.photos, lastOpenedAt: new Date().toISOString() },
          ...state.projects.filter((project) => project.id !== action.project.id)
        ]
      };
    case "replace-project-photos":
      return {
        ...state,
        photos: state.currentProjectId === action.projectId ? action.photos : state.photos,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? { ...project, photos: action.photos, coverUrl: selectProjectCoverUrls(action.photos)[0] ?? project.coverUrl, coverUrls: selectProjectCoverUrls(action.photos) }
            : project
        )
      };
    case "rename-project":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId ? { ...project, name: action.name } : project
        )
      };
    case "toggle-project-pin":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId ? { ...project, pinned: !project.pinned } : project
        )
      };
    case "rate-project":
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId ? { ...project, rating: Math.min(5, Math.max(0, action.rating)) } : project
        )
      };
    case "delete-project": {
      const deletingCurrentProject = state.currentProjectId === action.projectId;
      const project = state.projects.find((item) => item.id === action.projectId);
      return {
        ...state,
        view: deletingCurrentProject ? "welcome" : state.view,
        currentProjectId: deletingCurrentProject ? null : state.currentProjectId,
        selectedPhotoId: deletingCurrentProject ? null : state.selectedPhotoId,
        photos: deletingCurrentProject ? [] : state.photos,
        projects: state.projects.filter((item) => item.id !== action.projectId),
        deletedProjects: project
          ? [{ ...project, deletedAt: new Date().toISOString() }, ...state.deletedProjects.filter((item) => item.id !== action.projectId)]
          : state.deletedProjects
      };
    }
    case "restore-project": {
      const project = state.deletedProjects.find((item) => item.id === action.projectId);
      if (!project) return state;
      const restored = { ...project, deletedAt: undefined };
      return {
        ...state,
        projects: [restored, ...state.projects.filter((item) => item.id !== action.projectId)],
        deletedProjects: state.deletedProjects.filter((item) => item.id !== action.projectId)
      };
    }
    case "purge-project":
      return {
        ...state,
        deletedProjects: state.deletedProjects.filter((project) => project.id !== action.projectId)
      };
    case "empty-trash":
      return { ...state, deletedProjects: [] };
    case "invalidate-thumbnails":
      return {
        ...state,
        photos: invalidatePhotoThumbnails(state.photos),
        projects: state.projects.map((project) => ({
          ...project,
          photos: project.photos ? invalidatePhotoThumbnails(project.photos) : project.photos,
          coverUrl: undefined,
          coverUrls: undefined
        })),
        deletedProjects: state.deletedProjects.map((project) => ({
          ...project,
          photos: project.photos ? invalidatePhotoThumbnails(project.photos) : project.photos,
          coverUrl: undefined,
          coverUrls: undefined
        }))
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
    case "set-compare-sort":
      return { ...state, compareSort: action.sort };
    case "toggle-sidebar":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case "toggle-inspector":
      return { ...state, inspectorCollapsed: !state.inspectorCollapsed };
    case "rate-photo":
      {
        const photos = updatePhoto(state.photos, action.photoId, (photo) => ({
          ...photo,
          rating: photo.rating === action.rating ? 0 : action.rating
        }));
        return {
          ...state,
          photos,
          projects: syncCurrentProjectPhotos(state, photos)
        };
      }
    case "flag-photo":
      {
        const photos = updatePhoto(state.photos, action.photoId, (photo) => ({ ...photo, state: action.state }));
        return {
          ...state,
          photos,
          projects: syncCurrentProjectPhotos(state, photos)
        };
      }
    case "set-gpu":
      return { ...state, gpuEnabled: action.enabled };
    case "update-user":
      return { ...state, user: action.user };
    case "register-person":
      return {
        ...state,
        people: [action.person, ...state.people.filter((person) => person.id !== action.person.id)]
      };
    case "rename-person":
      return {
        ...state,
        people: state.people.map((person) => (person.id === action.personId ? { ...person, name: action.name } : person))
      };
    case "delete-person":
      return {
        ...state,
        selectedPersonId: state.selectedPersonId === action.personId ? null : state.selectedPersonId,
        people: state.people.filter((person) => person.id !== action.personId),
        photos: state.photos.map((photo) => ({
          ...photo,
          people: photo.people.filter((personId) => personId !== action.personId)
        })),
        projects: state.projects.map((project) => ({
          ...project,
          photos: project.photos
            ? project.photos.map((photo) => ({ ...photo, people: photo.people.filter((personId) => personId !== action.personId) }))
            : project.photos
        })),
        deletedProjects: state.deletedProjects.map((project) => ({
          ...project,
          photos: project.photos
            ? project.photos.map((photo) => ({ ...photo, people: photo.people.filter((personId) => personId !== action.personId) }))
            : project.photos
        }))
      };
    case "set-ai-rule":
      return { ...state, aiRules: { ...state.aiRules, [action.rule]: action.enabled } };
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

function selectProjectCoverUrls(photos: PhotoSummary[], count = 4) {
  const previewPhotos = photos.filter((photo) => photo.src);
  const ratedPhotos = previewPhotos.filter((photo) => photo.rating > 0);
  const candidates = ratedPhotos.length
    ? [...ratedPhotos].sort((left, right) => right.rating - left.rating || left.id - right.id)
    : stableSpread(previewPhotos, count);

  return candidates.slice(0, count).map((photo) => photo.src).filter((src): src is string => Boolean(src));
}

function stableSpread<T>(items: T[], count: number) {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, index) => items[Math.floor((index * (items.length - 1)) / Math.max(1, count - 1))]);
}

function invalidatePhotoThumbnails(photos: PhotoSummary[]) {
  return photos.map((photo) => ({
    ...photo,
    src: photo.originalSrc ?? photo.src,
    thumbSrc: undefined
  }));
}

export function visiblePhotos(state: AppState): PhotoSummary[] {
  return state.photos.filter((photo) => {
    if (state.collection === "picks" && photo.state !== "pick") return false;
    if (state.collection === "rejects" && photo.state !== "reject") return false;
    if (state.collection === "unrated" && (photo.rating > 0 || photo.state)) return false;
    if (state.collection === "smart-sharp" && (!photo.analyzed || photo.sharpness < 0.72)) return false;
    if (state.collection === "smart-blurry" && (!photo.analyzed || photo.sharpness >= 0.55)) return false;
    if (state.collection === "smart-eyes-closed" && (!photo.analyzed || !photo.eyesClosed)) return false;
    if (state.collection === "smart-best" && (!photo.analyzed || photo.bestInBurst < 0.7)) return false;
    if (state.selectedPersonId && !photo.people.includes(state.selectedPersonId)) return false;
    if (state.filters.includes("rating") && photo.rating < 3) return false;
    if (state.filters.includes("sharp") && (!photo.analyzed || photo.sharpness < 0.72)) return false;
    if (state.filters.includes("eyes") && (!photo.analyzed || photo.eyesClosed)) return false;
    if (state.filters.includes("nodup") && photo.duplicateGroupId) return false;
    if (state.filters.includes("people") && photo.people.length === 0) return false;
    return true;
  });
}
