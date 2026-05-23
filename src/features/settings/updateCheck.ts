import packageJson from "../../../package.json";

const LATEST_RELEASE_URL = "https://api.github.com/repos/chencn2020/Sift/releases/latest";

export type UpdateCheckResult =
  | { status: "available"; currentVersion: string; latestVersion: string; releaseUrl: string }
  | { status: "current"; currentVersion: string; latestVersion: string; releaseUrl?: string }
  | { status: "none"; currentVersion: string }
  | { status: "error"; currentVersion: string; message: string };

interface GitHubRelease {
  tag_name?: string;
  html_url?: string;
}

export const CURRENT_VERSION = packageJson.version;

export async function checkForUpdates(): Promise<UpdateCheckResult> {
  try {
    const response = await fetch(LATEST_RELEASE_URL, {
      headers: {
        Accept: "application/vnd.github+json"
      },
      cache: "no-store"
    });

    if (response.status === 404) return { status: "none", currentVersion: CURRENT_VERSION };
    if (!response.ok) {
      return { status: "error", currentVersion: CURRENT_VERSION, message: `HTTP ${response.status}` };
    }

    const release = (await response.json()) as GitHubRelease;
    const latestVersion = normalizeVersion(release.tag_name ?? "");
    if (!latestVersion) return { status: "none", currentVersion: CURRENT_VERSION };

    const releaseUrl = release.html_url ?? "https://github.com/chencn2020/Sift/releases";
    if (compareVersions(latestVersion, normalizeVersion(CURRENT_VERSION)) > 0) {
      return { status: "available", currentVersion: CURRENT_VERSION, latestVersion, releaseUrl };
    }

    return { status: "current", currentVersion: CURRENT_VERSION, latestVersion, releaseUrl };
  } catch (error) {
    return {
      status: "error",
      currentVersion: CURRENT_VERSION,
      message: error instanceof Error ? error.message : "Network error"
    };
  }
}

function normalizeVersion(value: string) {
  return value.trim().replace(/^v/i, "");
}

function compareVersions(left: string, right: string) {
  const leftParts = numericVersionParts(left);
  const rightParts = numericVersionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function numericVersionParts(value: string) {
  return value
    .split(/[.-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}
