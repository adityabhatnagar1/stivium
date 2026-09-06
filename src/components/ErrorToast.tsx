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
        background: "var(--color-error)",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: "var(--radius-sm)",
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
          color: "#fff",
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
