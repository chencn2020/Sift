import type { AppState, PhotoSummary, PhotoState } from "../../app/types";

export function photoCounts(photos: PhotoSummary[]) {
  return {
    all: photos.length,
    picks: photos.filter((photo) => photo.state === "pick").length,
    rejects: photos.filter((photo) => photo.state === "reject").length,
    unrated: photos.filter((photo) => photo.rating === 0 && !photo.state).length
  };
}

export function rejectReasons(photo: PhotoSummary): string[] {
  const reasons: string[] = [];
  if (photo.sharpness < 0.55) reasons.push("模糊");
  if (photo.eyesClosed) reasons.push("闭眼");
  if (photo.duplicateGroupId) reasons.push("重复");
  return reasons;
}

export function planAiChanges(state: AppState): Array<{ photoId: number; state: PhotoState }> {
  const changes = new Map<number, PhotoState>();

  if (state.aiRules.bestOfBurst) {
    const bursts = new Map<string, PhotoSummary[]>();
    state.photos.forEach((photo) => {
      if (!photo.burstId) return;
      bursts.set(photo.burstId, [...(bursts.get(photo.burstId) ?? []), photo]);
    });
    bursts.forEach((items) => {
      const best = [...items].sort((a, b) => b.bestInBurst - a.bestInBurst || b.sharpness - a.sharpness)[0];
      if (best) changes.set(best.id, "pick");
      items.filter((photo) => photo.id !== best?.id).forEach((photo) => changes.set(photo.id, "reject"));
    });
  }

  if (state.aiRules.rejectEyesClosed) {
    state.photos.filter((photo) => photo.eyesClosed).forEach((photo) => changes.set(photo.id, "reject"));
  }

  if (state.aiRules.rejectBlurry) {
    state.photos.filter((photo) => photo.sharpness < 0.55).forEach((photo) => changes.set(photo.id, "reject"));
  }

  if (state.aiRules.rejectDuplicates) {
    const groups = new Map<string, PhotoSummary[]>();
    state.photos.forEach((photo) => {
      if (!photo.duplicateGroupId) return;
      groups.set(photo.duplicateGroupId, [...(groups.get(photo.duplicateGroupId) ?? []), photo]);
    });
    groups.forEach((items) => {
      const best = [...items].sort((a, b) => b.sharpness - a.sharpness)[0];
      items.filter((photo) => photo.id !== best?.id).forEach((photo) => changes.set(photo.id, "reject"));
    });
  }

  if (state.aiRules.pickHighRated) {
    state.photos.filter((photo) => photo.rating >= 4).forEach((photo) => changes.set(photo.id, "pick"));
  }

  return Array.from(changes, ([photoId, nextState]) => ({ photoId, state: nextState }));
}
