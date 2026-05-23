import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createTranslator } from "../../app/i18n";
import { initialState } from "../../app/state";
import { SettingsModal } from "./SettingsModal";

describe("SettingsModal", () => {
  it("switches panes and calls setting handlers", () => {
    const onGpuChange = vi.fn();
    const onThemeChange = vi.fn();
    const onLanguageChange = vi.fn();

    render(
      <SettingsModal
        open
        state={initialState}
        t={createTranslator("cn")}
        onClose={vi.fn()}
        onGpuChange={onGpuChange}
        onThemeChange={onThemeChange}
        onLanguageChange={onLanguageChange}
        storageInfo={{
          dataDir: "/tmp/Sift",
          cacheDir: "/tmp/Sift/cache",
          databasePath: "/tmp/Sift/sift.sqlite",
          thumbnailCacheDir: "/tmp/Sift/cache/thumbnails",
          faceCacheDir: "/tmp/Sift/cache/faces"
        }}
        onClearThumbnailCache={vi.fn()}
        onOpenRegisterPerson={vi.fn()}
        onRenamePerson={vi.fn()}
        onDeletePerson={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /存储/ }));
    expect(screen.getByDisplayValue("/tmp/Sift/sift.sqlite")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /通用/ }));
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(onLanguageChange).toHaveBeenCalledWith("en");

    fireEvent.click(screen.getByRole("button", { name: "浅色" }));
    expect(onThemeChange).toHaveBeenCalledWith("light");

    fireEvent.click(screen.getByRole("button", { name: /AI/ }));
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onGpuChange).toHaveBeenCalledWith(false);
  });
});
