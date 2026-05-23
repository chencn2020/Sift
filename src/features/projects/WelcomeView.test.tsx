import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectSummary } from "../../app/types";
import { WelcomeView } from "./WelcomeView";

const labels: Record<string, string> = {
  allProjects: "所有项目",
  allProjectsHint: "显示全部已导入项目，原图仍保留在本地原路径。",
  browseHint: "或点击选择文件夹",
  cancel: "取消",
  defaultAvatars: "默认头像",
  displayName: "昵称",
  dropFolder: "将文件夹拖到这里",
  editProfile: "编辑资料",
  enabled: "已启用",
  gpu: "GPU 加速",
  importFirstProject: "从活动照片文件夹导入后即可开始筛选。",
  local: "本地",
  localOnly: "默认本地运行，不上传照片",
  localWorkspace: "本地工作区",
  lastOpened: "最新打开",
  newFromFolder: "+ 从文件夹新建",
  noProjects: "还没有项目",
  notOpenedYet: "尚未打开",
  photos: "照片",
  privacyMode: "隐私模式",
  projects: "项目",
  recent: "最近项目",
  recentlyDeleted: "最近删除",
  save: "保存",
  settings: "设置",
  uploadAvatar: "上传头像",
  username: "用户名"
};

function t(key: string) {
  return labels[key] ?? key;
}

const user = {
  displayName: "本地暗房",
  username: "local-darkroom",
  avatarId: "iris"
};

function makeProject(id: string, lastOpenedAt: string): ProjectSummary {
  return {
    id,
    name: id,
    date: "2026-05-23",
    total: 10,
    status: "ready",
    lastOpenedAt
  };
}

describe("WelcomeView", () => {
  it("imports files dropped anywhere on the welcome page", async () => {
    const onImportFiles = vi.fn();
    const file = new File(["image"], "event/photo-001.jpg", { type: "image/jpeg" });
    const dataTransfer = {
      types: ["Files"],
      items: [],
      files: [file],
      dropEffect: "none"
    } as unknown as DataTransfer;

    render(
      <WelcomeView
        projects={[]}
        deletedProjects={[]}
        user={user}
        t={t}
        onOpenProject={vi.fn()}
        onImportFiles={onImportFiles}
        onOpenSettings={vi.fn()}
        onUpdateUser={vi.fn()}
        onRenameProject={vi.fn()}
        onToggleProjectPinned={vi.fn()}
        onRateProject={vi.fn()}
        onDeleteProject={vi.fn()}
        onRestoreProject={vi.fn()}
        onEmptyTrash={vi.fn()}
      />
    );

    const page = screen.getByText("Sift").closest(".welcome-drop-target");
    expect(page).not.toBeNull();

    fireEvent.dragEnter(page as Element, { dataTransfer });
    expect(page).toHaveClass("dragging");

    fireEvent.drop(page as Element, { dataTransfer });
    await waitFor(() => expect(onImportFiles).toHaveBeenCalledWith([file]));
  });

  it("shows only one row of recent projects and opens all projects in a sheet", () => {
    const projects = [
      makeProject("old", "2026-05-20T10:00:00.000Z"),
      makeProject("new", "2026-05-23T10:00:00.000Z"),
      makeProject("middle", "2026-05-22T10:00:00.000Z"),
      makeProject("older", "2026-05-19T10:00:00.000Z"),
      makeProject("newer", "2026-05-24T10:00:00.000Z")
    ];

    const { container } = render(
      <WelcomeView
        projects={projects}
        deletedProjects={[]}
        user={user}
        t={t}
        onOpenProject={vi.fn()}
        onImportFiles={vi.fn()}
        onOpenSettings={vi.fn()}
        onUpdateUser={vi.fn()}
        onRenameProject={vi.fn()}
        onToggleProjectPinned={vi.fn()}
        onRateProject={vi.fn()}
        onDeleteProject={vi.fn()}
        onRestoreProject={vi.fn()}
        onEmptyTrash={vi.fn()}
      />
    );

    const recentGrid = container.querySelector(".recent-project-grid");
    expect(recentGrid).not.toBeNull();
    expect(within(recentGrid as HTMLElement).getByText("newer")).toBeInTheDocument();
    expect(within(recentGrid as HTMLElement).queryByText("older")).toBeNull();
    expect(within(recentGrid as HTMLElement).getAllByText(/最新打开/)).toHaveLength(4);

    fireEvent.click(within(container).getByRole("button", { name: "所有项目" }));
    expect(within(container).getByRole("heading", { name: "所有项目" })).toBeInTheDocument();
    expect(within(container).getByText("older")).toBeInTheDocument();
  });
});
