import type { CSSProperties } from "react";

type PetReviewDialogProps = {
  isOpen: boolean;
  fileName: string;
  currentContent: string;
  proposedContent: string;
  onApply: () => void;
  onDiscard: () => void;
};

export function PetReviewDialog({
  isOpen,
  fileName,
  currentContent,
  proposedContent,
  onApply,
  onDiscard,
}: PetReviewDialogProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div
      className="stv-dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 2100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="stv-dialog-panel"
        style={{
          width: "760px",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
          padding: "18px",
        }}
      >
        <div
          style={{ fontSize: "14px", marginBottom: "12px", fontWeight: 700 }}
        >
          Review AI edit — {fileName}
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <ColumnPreview label="Current" content={currentContent} />
          <ColumnPreview label="Proposed" content={proposedContent} accent />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <button
            onClick={onDiscard}
            className="stv-btn"
            style={discardBtnStyle}
          >
            Discard
          </button>
          <button onClick={onApply} className="stv-btn" style={applyBtnStyle}>
            Apply to editor
          </button>
        </div>
      </div>
    </div>
  );
}

function ColumnPreview({
  label,
  content,
  accent,
}: {
  label: string;
  content: string;
  accent?: boolean;
}) {
  const style: CSSProperties = {
    border: `1px solid ${accent ? "var(--color-accent-strong)" : "var(--color-border)"}`,
    borderRadius: "var(--radius-md)",
    background: "var(--color-bg)",
    padding: "10px",
    overflow: "auto",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
  return (
    <div>
      <div
        style={{
          fontSize: "11px",
          color: "var(--color-text-muted)",
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div style={style}>{content}</div>
    </div>
  );
}

const discardBtnStyle: CSSProperties = {
  minWidth: "88px",
  padding: "8px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
  cursor: "pointer",
  fontWeight: 600,
};
const applyBtnStyle: CSSProperties = {
  minWidth: "120px",
  padding: "8px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-accent-strong)",
  background:
    "linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-strong) 100%)",
  color: "#f7f8f8",
  cursor: "pointer",
  fontWeight: 700,
};
