import type { MouseEvent } from "react";
import type { Tab } from "../types";
import { IconClose } from "./Icons";

type EditorTabsProps = {
  tabs: Tab[];
  activeTabPath: string | null;
  onSelectTab: (path: string) => void;
  onCloseTab: (event: MouseEvent, path: string) => void;
};

export function EditorTabs({
  tabs,
  activeTabPath,
  onSelectTab,
  onCloseTab,
}: EditorTabsProps): JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        backgroundColor: "var(--color-surface)",
        borderBottom: "var(--border-hairline)",
        height: "36px",
        boxSizing: "border-box",
        overflowX: "auto",
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTabPath === tab.path;
        return (
          <div
            key={tab.path}
            onClick={() => onSelectTab(tab.path)}
            className={`stv-tab${isActive ? " stv-tab--active" : ""}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "0 var(--space-3)",
              height: "100%",
              boxSizing: "border-box",
              backgroundColor: isActive
                ? "var(--color-bg)"
                : "var(--color-tab-inactive)",
              borderTop: isActive
                ? "2px solid var(--color-accent)"
                : "2px solid transparent",
              borderRight: "var(--border-hairline)",
              cursor: "pointer",
              fontSize: "var(--text-body)",
              fontWeight: isActive ? 510 : 400,
              letterSpacing: "var(--tracking-small)",
              color: isActive
                ? "var(--color-text)"
                : "var(--color-text-muted)",
            }}
          >
          {tab.content !== tab.savedContent && (
            <span
              aria-hidden="true"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--color-warn)",
                flexShrink: 0,
              }}
            />
          )}
          {tab.name}
          <div
            onClick={(event) => onCloseTab(event, tab.path)}
            className="stv-tab-close"
            style={{
              borderRadius: "var(--radius-xs)",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "transparent",
            }}
          >
            <IconClose size={11} />
          </div>
        </div>
      );
    })}
  </div>
);
}
