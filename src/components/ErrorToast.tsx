import { IconClose } from "./Icons";

type ErrorToastProps = {
  message: string | null;
  onClose: () => void;
};

export function ErrorToast({
  message,
  onClose,
}: ErrorToastProps): JSX.Element | null {
  if (!message) return null;
  return (
    <div
      className="stv-toast"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        background: "var(--color-danger)",
        border: "1px solid var(--color-danger-strong)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
        color: "var(--color-text)",
        padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        zIndex: 2200,
        display: "flex",
        alignItems: "center",
      }}
    >
      {message}
      <button
        onClick={onClose}
        className="stv-icon-btn"
        style={{
          marginLeft: "12px",
          border: "none",
          background: "transparent",
          color: "var(--color-text)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconClose size={13} />
      </button>
    </div>
  );
}
