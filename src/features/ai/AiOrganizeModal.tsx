import type { AppState } from "../../app/types";
import { Modal } from "../../components/Modal";
import { planAiChanges } from "../library/photoRules";

interface AiOrganizeModalProps {
  open: boolean;
  state: AppState;
  t: (key: string) => string;
  onClose: () => void;
  onApply: () => void;
}

export function AiOrganizeModal({ open, state, t, onClose, onApply }: AiOrganizeModalProps) {
  const changes = planAiChanges(state);
  const picks = changes.filter((change) => change.state === "pick").length;
  const rejects = changes.filter((change) => change.state === "reject").length;

  return (
    <Modal
      open={open}
      className="md-ai"
      title={t("aiOrganize")}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            取消
          </button>
          <button className="btn-primary" onClick={onApply}>
            应用整理
          </button>
        </>
      }
    >
      <div className="ai-intro">
        <h3>一键智能筛选</h3>
        <p>
          将分析当前项目的 <b>{state.photos.length}</b> 张照片，并按规则应用到本地元数据。
        </p>
      </div>
      <div className="ai-rules">
        <Rule checked label="保留每组连拍中 AI 评分最高的一张" count="12 组连拍" />
        <Rule checked label="弃掉所有闭眼照片" count="约 8 张" />
        <Rule checked label="弃掉极度模糊的照片" count="清晰度 < 0.55" />
        <Rule label="弃掉重复照片，保留最锐利的一张" count="31 组" />
        <Rule label="保留所有星标 ≥ 4 的照片" count="14 张" />
      </div>
      <div className="ai-summary">
        <span>
          预计选中 <b>{picks}</b>
        </span>
        <span>
          预计弃掉 <b>{rejects}</b>
        </span>
        <span>{t("analysisReady")}</span>
      </div>
    </Modal>
  );
}

function Rule({ checked, label, count }: { checked?: boolean; label: string; count: string }) {
  return (
    <label className="ai-rule">
      <input type="checkbox" defaultChecked={checked} />
      <span>{label}</span>
      <em>{count}</em>
    </label>
  );
}
