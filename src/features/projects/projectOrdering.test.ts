import { describe, expect, it } from "vitest";
import type { ProjectSummary } from "../../app/types";
import { allProjects, recentProjects } from "./projectOrdering";

function project(id: string, lastOpenedAt: string, pinned = false): ProjectSummary {
  return {
    id,
    name: id,
    date: "2026-05-23",
    total: 1,
    status: "ready",
    lastOpenedAt,
    pinned
  };
}

describe("project ordering", () => {
  const projects = [
    project("old", "2026-05-20T10:00:00.000Z"),
    project("new", "2026-05-23T10:00:00.000Z"),
    project("middle", "2026-05-22T10:00:00.000Z"),
    project("pinned", "2026-05-19T10:00:00.000Z", true),
    project("newer", "2026-05-24T10:00:00.000Z")
  ];

  it("keeps recent projects strictly ordered by last opened time", () => {
    expect(recentProjects(projects).map((item) => item.id)).toEqual(["newer", "new", "middle", "old"]);
  });

  it("keeps pinned projects first in the full list", () => {
    expect(allProjects(projects).map((item) => item.id)).toEqual(["pinned", "newer", "new", "middle", "old"]);
  });
});
