import type { CSSProperties, MouseEvent } from "react";
import { TitleBarStarfield } from "./TitleBarStarfield";
import { CuteBotIcon } from "./CuteBotIcon";
import {
  IconMenu,
  IconMinimize,
  IconMaximize,
  IconRestore,
  IconClose,
  IconPlay,
} from "./Icons";

type AppMenuId = "file" | "edit" | "selection" | "view" | "help";

type TitleBarProps = {
  appIcon: string;
  isTopMenuExpanded: boolean;
  isWindowMaximized: boolean;
  isWindowFocused: boolean;
  isAiActive: boolean;
  isRunning: boolean;
  canRun: boolean;
  onRun: () => void;
  onToggleMenu: () => void;
  onOpenMenu: (menuId: AppMenuId, event: MouseEvent<HTMLButtonElement>) => void;
  onToggleAi: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
};

const menuItems: AppMenuId[] = ["file", "edit", "selection", "view", "help"];
const ICON_SIZE_DEFAULT = 15;

export function TitleBar({
  appIcon,
  isTopMenuExpanded,
  isWindowMaximized,
  isWindowFocused,
  isAiActive,
  isRunning,
  canRun,
  onRun,
  onToggleMenu,
  onOpenMenu,
  onToggleAi,
  onMinimize,
  onToggleMaximize,
  onClose,
}: TitleBarProps): JSX.Element {
  return (
    <div
      data-tauri-drag-region
      className="stv-titlebar"
      style={
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "44px",
          background: "var(--color-titlebar)",
          borderBottom: "var(--border-hairline)",
          WebkitAppRegion: "drag",
        } as CSSProperties
      }
    >
      <TitleBarStarfield isPaused={!isWindowFocused} />

      <div
        className="stv-titlebar-content"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingLeft: "10px",
        }}
      >
        <img src={appIcon} alt="" style={{ width: "16px", height: "16px" }} />
        <button
          onClick={onToggleMenu}
          title="Menu"
          aria-label="Menu"
          aria-expanded={isTopMenuExpanded}
          className="stv-icon-btn"
          style={
            {
              background: "transparent",
              border: "none",
              color: "var(--color-text)",
              fontSize: "var(--text-body)",
              cursor: "pointer",
              width: "var(--control-size-default)",
              height: "var(--control-size-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              WebkitAppRegion: "no-drag",
            } as CSSProperties
          }
        >
          <span
            className={`stv-menu-icon${isTopMenuExpanded ? " stv-menu-icon--open" : ""}`}
          >
            <IconMenu size={ICON_SIZE_DEFAULT} />
          </span>
        </button>
        <div
          className={`stv-app-menu${isTopMenuExpanded ? " stv-app-menu--open" : ""}`}
          aria-hidden={!isTopMenuExpanded}
        >
          {menuItems.map((menuId) => (
            <button
              key={menuId}
              tabIndex={isTopMenuExpanded ? 0 : -1}
              onClick={(event) => onOpenMenu(menuId, event)}
              className="stv-app-menu-item"
              style={
                {
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text)",
                  fontSize: "var(--text-body)",
                  cursor: "pointer",
                  height: "var(--control-size-default)",
                  padding: "0 var(--space-2)",
                  borderRadius: "var(--radius-xs)",
                  textTransform: "capitalize",
                  WebkitAppRegion: "no-drag",
                } as CSSProperties
              }
            >
              {menuId}
            </button>
          ))}
        </div>
      </div>
      <div
        className="stv-titlebar-content"
        style={
          {
            display: "flex",
            alignItems: "stretch",
            WebkitAppRegion: "no-drag",
          } as CSSProperties
        }
      >
        <button
          onClick={onRun}
          disabled={!canRun}
          title={
            isRunning
              ? "Running with Icarus Verilog"
              : canRun
                ? "Run with Icarus Verilog"
                : "Run requires an open Verilog file"
          }
          aria-label={
            isRunning
              ? "Running with Icarus Verilog"
              : "Run with Icarus Verilog"
          }
          className="stv-wincontrol"
          style={{
            width: "52px",
            border: "none",
            background: "transparent",
            color: canRun ? "var(--color-accent)" : "var(--color-text-faint)",
            cursor: canRun ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            opacity: isRunning ? 0.7 : 1,
          }}
        >
          <IconPlay
            size={ICON_SIZE_DEFAULT}
            className={isRunning ? "stv-icon-pulse" : undefined}
          />
          <span style={{ fontSize: "12px" }}>
            {isRunning ? "Running" : "Run"}
          </span>
        </button>
        <CuteBotIcon
          isRunning={isRunning}
          isAiActive={isAiActive}
          onClick={onToggleAi}
        />
        <button
          onClick={onMinimize}
          title="Minimize"
          aria-label="Minimize"
          className="stv-wincontrol"
          style={{
            width: "46px",
            border: "none",
            background: "transparent",
            color: "var(--color-text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconMinimize size={ICON_SIZE_DEFAULT} />
        </button>
        <button
          onClick={onToggleMaximize}
          title={isWindowMaximized ? "Restore" : "Maximize"}
          aria-label={isWindowMaximized ? "Restore" : "Maximize"}
          className="stv-wincontrol"
          style={{
            width: "46px",
            border: "none",
            background: "transparent",
            color: "var(--color-text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isWindowMaximized ? (
            <IconRestore size={ICON_SIZE_DEFAULT - 1} />
          ) : (
            <IconMaximize size={ICON_SIZE_DEFAULT - 2} />
          )}
        </button>
        <button
          onClick={onClose}
          title="Close"
          aria-label="Close"
          className="stv-wincontrol stv-wincontrol--close"
          style={{
            width: "46px",
            border: "none",
            background: "transparent",
            color: "var(--color-text)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconClose size={ICON_SIZE_DEFAULT} />
        </button>
      </div>
    </div>
  );
}
