import type { AppState } from "../../app/types";
import { Modal } from "../../components/Modal";

interface SettingsModalProps {
  open: boolean;
  state: AppState;
  t: (key: string) => string;
  onClose: () => void;
  onGpuChange: (enabled: boolean) => void;
}

export function SettingsModal({ open, state, t, onClose, onGpuChange }: SettingsModalProps) {
  return (
    <Modal open={open} className="md-settings" title={t("settings")} onClose={onClose}>
      <div className="settings-pane-shell">
        <nav className="settings-tabs compact">
          <button className="settings-tab active">⚙ 通用</button>
          <button className="settings-tab">▤ 存储</button>
          <button className="settings-tab">✦ AI</button>
          <button className="settings-tab">↑ 导出</button>
          <button className="settings-tab">◌ 关于</button>
        </nav>
        <div className="settings-pane active">
          <section className="settings-row">
            <span className="lbl">隐私</span>
            <div className="val">
              <label className="check">
                <input type="checkbox" checked readOnly /> {t("localOnly")}
              </label>
              <label className="check">
                <input type="checkbox" /> 可选云端 AI（默认关闭）
              </label>
            </div>
          </section>
          <section className="settings-row">
            <span className="lbl">{t("gpu")}</span>
            <div className="val">
              <label className="switch">
                <input type="checkbox" checked={state.gpuEnabled} onChange={(event) => onGpuChange(event.currentTarget.checked)} />
                <span />
              </label>
            </div>
          </section>
          <section className="settings-row">
            <span className="lbl">缓存路径</span>
            <div className="val">
              <input type="text" value="~/Library/Caches/Sift" readOnly />
              <p className="hint">缩略图、AI 评分、感知哈希缓存，可删除后自动重建。</p>
            </div>
          </section>
          <section className="settings-row">
            <span className="lbl">版本</span>
            <div className="val">
              <b>0.1.0-alpha.0</b>
              <p className="hint">{t("updateReserved")}</p>
            </div>
          </section>
        </div>
      </div>
    </Modal>
  );
}
