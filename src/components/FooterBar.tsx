type FooterBarProps = {
  workspaceName: string;
  line: number;
  column: number;
  language?: string;
  encoding?: string;
};

export function FooterBar({
  workspaceName,
  line,
  column,
  language = "plaintext",
  encoding = "UTF-8",
}: FooterBarProps): JSX.Element {
  return (
    <div
      style={{
        height: "var(--control-size-compact)",
        background: "var(--color-surface-2)",
        borderTop: "var(--border-hairline)",
        color: "var(--color-text-muted)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-3)",
        fontSize: "var(--text-caption)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          overflow: "hidden",
          maxWidth: "55%",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--color-accent)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {workspaceName}
        </span>
      </div>
      <div>
        Ln {line}, Col {column} · {language} · {encoding}
      </div>
    </div>
  );
}
