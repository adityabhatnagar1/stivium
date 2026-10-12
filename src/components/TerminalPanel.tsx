import { memo } from "react";
import type { MouseEvent, RefObject } from "react";
import type { TermTab } from "../types";

import { IconTerminal, IconClose, IconPlus } from "./Icons";

type TerminalPanelProps = {
  panelRef: React.RefObject<HTMLDivElement | null>;
  termTabs: TermTab[];
  activeTermId: string | null;
  fileTreePath?: string;
  height: number;
  onSelectTab: (id: string) => void;
  onCloseTab: (event: MouseEvent, id: string) => void;
  onCreateTerminal: (cwd?: string) => void;
  onClearOutput: () => void;
};

function TerminalPanelImpl({
  panelRef,
  termTabs,
  activeTermId,
  fileTreePath,
  height,
  onSelectTab,
  onCloseTab,
  onCreateTerminal,
  onClearOutput,
}: TerminalPanelProps): JSX.Element {
  return (
    <div
      ref={panelRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height,
        minHeight: "120px",
        flexShrink: 0,
        backgroundColor: "var(--color-bg)",
        borderTop: "var(--border-hairline)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          backgroundColor: "var(--color-surface)",
          borderBottom: "var(--border-hairline)",
          height: "36px",
          boxSizing: "border-box",
        }}
      >
        {termTabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`stv-tab${activeTermId === tab.id ? " stv-tab--active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 var(--space-3)",
              height: "100%",
              boxSizing: "border-box",
              backgroundColor:
                activeTermId === tab.id ? "var(--color-bg)" : "transparent",
              borderTop:
                activeTermId === tab.id
                  ? "2px solid var(--color-accent)"
                  : "2px solid transparent",
              borderRight: "var(--border-hairline)",
              cursor: "pointer",
              fontSize: "var(--text-body)",
              fontWeight: activeTermId === tab.id ? 510 : 400,
              letterSpacing: "var(--tracking-small)",
              color:
                activeTermId === tab.id
                  ? "var(--color-text)"
                  : "var(--color-text-muted)",
            }}
          >
            {tab.id === "output" ? (
              <IconTerminal size={13} />
            ) : (
              <span>&gt;_</span>
            )}

            {tab.title}

            {tab.closable && (
              <div
                onClick={(e) => onCloseTab(e, tab.id)}
                className="stv-tab-close"
                style={{
                  cursor: "pointer",
                  borderRadius: "var(--radius-xs)",
                  padding: "3px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <IconClose size={11} />
              </div>
            )}
          </div>
        ))}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
          }}
        >
          {activeTermId === "output" && (
            <button
              onClick={onClearOutput}
              className="stv-icon-btn"
              title="Clear output"
              aria-label="Clear output"
              style={{
                background: "transparent",
                color: "var(--color-text-muted)",
                border: "none",
                cursor: "pointer",
                padding: "6px 12px",
                fontSize: "12px",
                fontFamily: "var(--font-ui)",
              }}
            >
              Clear
            </button>
          )}

          <button
            onClick={() => onCreateTerminal(fileTreePath)}
            className="stv-icon-btn"
            title="New terminal"
            aria-label="New terminal"
            style={{
              background: "transparent",
              color: "var(--color-text)",
              border: "none",
              cursor: "pointer",
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <IconPlus size={14} />
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          position: "relative",
          padding: "4px",
          boxSizing: "border-box",
        }}
      >
        {termTabs.map((tab) => (
          <div
            key={tab.id}
            id={`xterm-host-${tab.id}`}
            style={{
              height: "100%",
              width: "100%",
              display: activeTermId === tab.id ? "block" : "none",
            }}
          />
        ))}

        {termTabs.filter((tab) => tab.id !== "output").length === 0 &&
          activeTermId !== "output" && (
            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted)",
              }}
            >
              No active terminals. Click + to start one.
            </div>
          )}
      </div>
    </div>
  );
}

export const TerminalPanel = memo(TerminalPanelImpl);
