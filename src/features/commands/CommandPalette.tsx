import { Modal } from "../../components/Modal";

interface CommandPaletteProps {
  open: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onOpenAi: () => void;
  onOpenExport: () => void;
}

export function CommandPalette({ open, t, onClose, onOpenAi, onOpenExport }: CommandPaletteProps) {
  return (
    <Modal open={open} className="cmdk-modal" onClose={onClose}>
      <input className="cmdk-input" autoFocus placeholder={t("commandPlaceholder")} />
      <div className="cmdk-list">
        <button onClick={onOpenAi}>✦ {t("aiOrganize")}</button>
        <button onClick={onOpenExport}>↑ {t("exportSelected")}</button>
        <button>◯ 注册新人物</button>
      </div>
    </Modal>
  );
}
