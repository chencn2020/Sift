import { convertFileSrc, invoke, isTauri } from "@tauri-apps/api/core";

interface FaceReferenceResult {
  path: string;
}

export interface SavedFaceReference {
  avatarUrl: string;
  cachePath?: string;
}

export async function saveFaceReferenceImage(id: string, dataUrl: string, refIndex = 0): Promise<SavedFaceReference> {
  if (!canUseTauri()) return { avatarUrl: dataUrl, cachePath: undefined };

  const result = await invoke<FaceReferenceResult>("save_face_reference_data_url", { personId: id, refIndex, dataUrl });
  return {
    avatarUrl: convertFileSrc(result.path),
    cachePath: result.path
  };
}

export async function saveFaceReferenceImages(id: string, dataUrls: string[]): Promise<SavedFaceReference[]> {
  const saved: SavedFaceReference[] = [];
  for (let index = 0; index < dataUrls.length; index += 1) {
    saved.push(await saveFaceReferenceImage(id, dataUrls[index], index));
  }
  return saved;
}

export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("image read failed"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("image read failed"));
    reader.readAsDataURL(file);
  });
}

function canUseTauri() {
  try {
    return isTauri();
  } catch {
    return false;
  }
}
