export type ViewName = "welcome" | "library" | "loupe" | "compare" | "people";
export type PhotoState = "pick" | "reject" | null;
export type CompareSort = "name-asc" | "name-desc" | "time-asc" | "time-desc";
export type CollectionKey =
  | "all"
  | "picks"
  | "rejects"
  | "unrated"
  | "smart-sharp"
  | "smart-blurry"
  | "smart-eyes-closed"
  | "smart-best";

export interface ProjectSummary {
  id: string;
  name: string;
  date: string;
  total: number;
  status: "ready" | "in-progress";
  pinned?: boolean;
  rating?: number;
  coverUrl?: string;
  coverUrls?: string[];
  lastOpenedAt?: string;
  deletedAt?: string;
  photos?: PhotoSummary[];
}

export interface UserProfile {
  displayName: string;
  username?: string;
  avatarId: string;
  avatarDataUrl?: string;
}

export interface ImportProgress {
  id: string;
  active: boolean;
  phase: "scanning" | "thumbnailing" | "finalizing";
  current: number;
  total: number;
  label: string;
}

export interface PersonSummary {
  id: string;
  name: string;
  count: number;
  refs: number;
  color: string;
  kind: "registered" | "cluster";
  avatarUrl?: string;
  cachePath?: string;
  referencePaths?: string[];
  createdAt?: string;
}

export interface PhotoSummary {
  id: number;
  filename: string;
  src?: string;
  originalSrc?: string;
  thumbSrc?: string;
  thumbnailPath?: string;
  cacheKey?: string;
  sourcePath?: string;
  relativePath?: string;
  format?: string;
  takenAt: string;
  rating: number;
  state: PhotoState;
  analyzed?: boolean;
  sharpness: number;
  exposure: number;
  noise: number;
  smile: number;
  eyesClosed: boolean;
  people: string[];
  tags: string[];
  burstId?: string;
  duplicateGroupId?: string;
  bestInBurst: number;
  width: number;
  height: number;
  sizeBytes: number;
  camera: {
    body: string;
    lens: string;
    aperture: string;
    shutter: string;
    iso: number;
  };
}

export interface AiRuleState {
  bestOfBurst: boolean;
  rejectEyesClosed: boolean;
  rejectBlurry: boolean;
  rejectDuplicates: boolean;
  pickHighRated: boolean;
}

export interface AppState {
  view: ViewName;
  theme: "system" | "dark" | "light";
  language: "cn" | "en";
  currentProjectId: string | null;
  selectedPhotoId: number | null;
  selectedPersonId: string | null;
  collection: CollectionKey;
  filters: string[];
  thumbSize: number;
  compareLayout: 2 | 4 | 9;
  compareSort: CompareSort;
  sidebarCollapsed: boolean;
  inspectorCollapsed: boolean;
  gpuEnabled: boolean;
  aiRules: AiRuleState;
  projects: ProjectSummary[];
  deletedProjects: ProjectSummary[];
  people: PersonSummary[];
  photos: PhotoSummary[];
  user: UserProfile;
}

export interface ExportOptions {
  format: "jpg" | "png" | "original";
  quality: number;
  resolution: "original" | "4k" | "2k" | "web" | "email";
  destination: string;
  namingTemplate: string;
  groupBy: "none" | "person" | "rating" | "tag";
  watermark: boolean;
}
