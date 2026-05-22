import { useMemo, useState } from "react";
import type { AppState, ExportOptions } from "../../app/types";
import { Modal } from "../../components/Modal";

interface ExportModalProps {
  open: boolean;
  state: AppState;
  t: (key: string) => string;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
}

export function ExportModal({ open, state, t, onClose, onExport }: ExportModalProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: "jpg",
    quality: 80,
    resolution: "web",
    destination: "~/Pictures/Sift Export",
    namingTemplate: "{date}_{event}_{seq}",
    groupBy: "person",
    watermark: false
  });
  const selected = state.photos.filter((photo) => photo.state === "pick");
  const count = selected.length || state.photos.length;
  const preview = useMemo(() => {
    const ext = options.format === "original" ? "CR3" : options.format;
    return options.namingTemplate
      .replace("{date}", "2026-05-12")
      .replace("{event}", "event")
      .replace("{seq}", "001")
      .concat(`.${ext}`);
  }, [options.format, options.namingTemplate]);

  return (
    <Modal
      open={open}
      className="md-export"
      title={`${t("export")} · ${count} ${t("photos")}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={() => onExport(options)}>
            {t("export")}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label>格式</label>
        <div className="seg export-format">
          {(["jpg", "png", "original"] as const).map((format) => (
            <button
              className={`seg-btn ${options.format === format ? "active" : ""}`}
              key={format}
              onClick={() => setOptions({ ...options, format })}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>

        <label>质量</label>
        <input
          type="range"
          min={40}
          max={100}
          value={options.quality}
          onChange={(event) => setOptions({ ...options, quality: Number(event.currentTarget.value) })}
        />

        <label>分辨率</label>
        <div className="seg">
          {(["original", "4k", "2k", "web", "email"] as const).map((resolution) => (
            <button
              className={`seg-btn ${options.resolution === resolution ? "active" : ""}`}
              key={resolution}
              onClick={() => setOptions({ ...options, resolution })}
            >
              {resolution}
            </button>
          ))}
        </div>

        <label>目标位置</label>
        <input value={options.destination} onChange={(event) => setOptions({ ...options, destination: event.currentTarget.value })} />

        <label>命名</label>
        <div>
          <input value={options.namingTemplate} onChange={(event) => setOptions({ ...options, namingTemplate: event.currentTarget.value })} />
          <p className="hint">Preview: {preview}</p>
        </div>

        <label>分组</label>
        <select value={options.groupBy} onChange={(event) => setOptions({ ...options, groupBy: event.currentTarget.value as ExportOptions["groupBy"] })}>
          <option value="none">none</option>
          <option value="person">person</option>
          <option value="rating">rating</option>
          <option value="tag">tag</option>
        </select>
      </div>
      <div className="exp-summary">{count} files · estimated local export job</div>
    </Modal>
  );
}
