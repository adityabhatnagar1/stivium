import { useState } from "react";
import type { CSSProperties, MutableRefObject } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import type { Tab } from "../types";
import type { AiSettings, ChatMessage } from "../tauri/aiTypes";
import { getLanguage, getSelectedCodeFromEditor } from "../utils/editor";
import { useAiSession, type AiSessionStatus } from "./useAiSession";

type PetChatPanelProps = {
  anchor: { x: number; y: number };
  activeTab: Tab | undefined;
  monacoEditorRef: MutableRefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  aiSettings: AiSettings;
  onClose: () => void;
  onStatusChange: (status: AiSessionStatus) => void;
  onProposeEdit: (proposedContent: string) => void;
  onOpenSettings: () => void;
};

const panelStyle: CSSProperties = {
  position: "absolute",
  width: "340px",
  maxHeight: "420px",
  display: "flex",
  flexDirection: "column",
  background: "var(--color-surface-elevated)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
  zIndex: 1900,
  overflow: "hidden",
};

function buildSystemContext(
  activeTab: Tab | undefined,
  selectedCode: string | null,
): string {
  if (!activeTab) return "The user has no file open in the editor.";
  const language = getLanguage(activeTab.name);
  const codeForContext = selectedCode ?? activeTab.content;
  const label = selectedCode
    ? "the user's current selection"
    : "the full active file";
  // Progressive context integration per the report: only the active
  // file (or selection, if any) is sent — not the whole workspace tree —
  // keeping each request's payload predictable and bounded.
  return [
    `You are an assistant embedded in Stivium, an RTL/Verilog IDE.`,
    `The user is editing "${activeTab.name}" (${language}).`,
    `Below is ${label}:`,
    "```" + language,
    codeForContext,
    "```",
  ].join("\n");
}

export function PetChatPanel({
  anchor,
  activeTab,
  monacoEditorRef,
  aiSettings,
  onClose,
  onStatusChange,
  onProposeEdit,
  onOpenSettings,
}: PetChatPanelProps): JSX.Element {
  const [prompt, setPrompt] = useState("");
  const { status, responseText, errorMessage, send, cancel } = useAiSession({
    onStatusChange,
  });

  const isConfigured = Boolean(aiSettings.provider && aiSettings.model);

  const runPrompt = (userText: string) => {
    if (!isConfigured || !aiSettings.provider || !aiSettings.model) return;
    // Capture the selection at the moment the prompt is actually sent,
    // instead of the parent querying Monaco on every render (fixes
    // Issue T). This is also more correct: the selection used is
    // whatever is selected right now, not whatever was selected on
    // App's last unrelated render.
    const selectedCode = getSelectedCodeFromEditor(monacoEditorRef.current);
    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemContext(activeTab, selectedCode) },
      { role: "user", content: userText },
    ];
    void send({
      provider: aiSettings.provider,
      model: aiSettings.model,
      baseUrl: aiSettings.baseUrl,
      messages,
    });
  };

  const quickActions: Array<{ label: string; prompt: string }> = [
    {
      label: "Explain this code",
      prompt: "Explain what this code does, concisely.",
    },
    {
      label: "Generate a testbench",
      prompt:
        "Write a Verilog testbench for this module. Only output the testbench code.",
    },
  ];

  const isBusy = status === "thinking" || status === "streaming";
  const canProposeEdit = status === "done" && responseText.trim().length > 0;

  return (
    <div style={{ ...panelStyle, left: anchor.x, top: anchor.y }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "var(--border-hairline)",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        Stivium AI
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className="stv-icon-btn"
            onClick={onOpenSettings}
            style={btnReset}
            title="Settings"
          >
            ⚙
          </button>
          <button
            className="stv-icon-btn"
            onClick={onClose}
            style={btnReset}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {!isConfigured ? (
        <div
          style={{
            padding: "14px",
            fontSize: "13px",
            color: "var(--color-text-muted)",
          }}
        >
          No AI provider configured yet.{" "}
          <button onClick={onOpenSettings} style={linkStyle}>
            Open settings
          </button>{" "}
          to add a provider and API key.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "6px",
              padding: "10px 12px",
              flexWrap: "wrap",
            }}
          >
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => runPrompt(action.prompt)}
                disabled={isBusy || !activeTab}
                className="stv-btn"
                style={quickActionStyle}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0 12px 12px",
              fontSize: "13px",
            }}
          >
            {status === "error" && errorMessage && (
              <div
                style={{ color: "var(--color-danger)", marginBottom: "8px" }}
              >
                {errorMessage}
              </div>
            )}
            {status === "cancelled" && (
              <div
                style={{
                  color: "var(--color-text-muted)",
                  marginBottom: "8px",
                }}
              >
                Cancelled.
              </div>
            )}
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "var(--font-mono)",
                margin: 0,
              }}
            >
              {responseText}
            </pre>
          </div>

          {canProposeEdit && (
            <div style={{ padding: "0 12px 10px" }}>
              <button
                onClick={() => onProposeEdit(responseText)}
                className="stv-btn"
                style={{ ...quickActionStyle, width: "100%" }}
              >
                Review as file edit…
              </button>
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!prompt.trim() || isBusy) return;
              runPrompt(prompt.trim());
              setPrompt("");
            }}
            style={{
              display: "flex",
              gap: "6px",
              padding: "10px 12px",
              borderTop: "var(--border-hairline)",
            }}
          >
            <input
              className="stv-input"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask about this file…"
              style={{ flex: 1 }}
              disabled={isBusy}
            />
            {isBusy ? (
              <button
                type="button"
                onClick={cancel}
                className="stv-btn"
                style={quickActionStyle}
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                className="stv-btn"
                style={quickActionStyle}
                disabled={!prompt.trim()}
              >
                Send
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}

const btnReset: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--color-text)",
  cursor: "pointer",
};

const linkStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "var(--color-accent)",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
};

const quickActionStyle: CSSProperties = {
  padding: "6px 10px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 600,
};
