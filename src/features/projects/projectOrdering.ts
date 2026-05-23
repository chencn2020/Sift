import type { ProjectSummary } from "../../app/types";

export const RECENT_PROJECT_LIMIT = 4;

export function recentProjects(projects: ProjectSummary[], limit = RECENT_PROJECT_LIMIT): ProjectSummary[] {
  return [...projects].sort(compareByLastOpened).slice(0, limit);
}

export function allProjects(projects: ProjectSummary[]): ProjectSummary[] {
  return [...projects].sort(
    (left, right) =>
      Number(Boolean(right.pinned)) - Number(Boolean(left.pinned)) ||
      compareByLastOpened(left, right) ||
      left.name.localeCompare(right.name, undefined, { numeric: true, sensitivity: "base" })
  );
}

function compareByLastOpened(left: ProjectSummary, right: ProjectSummary) {
  return timestampOf(right.lastOpenedAt) - timestampOf(left.lastOpenedAt);
}

function timestampOf(value: string | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
