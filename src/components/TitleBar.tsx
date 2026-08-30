import type { CSSProperties, MouseEvent } from "react";
import { TitleBarStarfield } from "./TitleBarStarfield";
import {
  IconMenu,
  IconMinimize,
  IconMaximize,
  IconRestore,
  IconClose,
} from "./Icons";

type AppMenuId = "file" | "edit" | "selection" | "view" | "help";

type TitleBarProps = {
  appIcon: string;
  isTopMenuExpanded: boolean;
  isWindowMaximized: boolean;
  onToggleMenu: () => void;
  onOpenMenu: (menuId: AppMenuId, event: MouseEvent<HTMLButtonElement>) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
};

const menuItems: AppMenuId[] = ["file", "edit", "selection", "view", "help"];

export function TitleBar({
  appIcon,
  isTopMenuExpanded,
  isWindowMaximized,
  onToggleMenu,
  onOpenMenu,
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
          height: "36px",
          background: "var(--color-titlebar)",
          borderBottom: "1px solid var(--color-border)",
          WebkitAppRegion: "drag",
        } as CSSProperties
      }
    >
      {/* Decorative starfield, always running behind the real content. */}
      <TitleBarStarfield />

      <div
        className="stv-titlebar-content"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingLeft: "10px",
        }}
      >
        <img
          src={appIcon}
          alt="App Icon"
          style={{ width: "16px", height: "16px" }}
        />
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
              fontSize: "14px",
              cursor: "pointer",
              padding: "4px 8px",
              WebkitAppRegion: "no-drag",
            } as CSSProperties
          }
        >
          <span
            className={`stv-menu-icon${isTopMenuExpanded ? " stv-menu-icon--open" : ""}`}
          >
            <IconMenu size={15} />
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
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "4px",
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
          onClick={onMinimize}
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
          <IconMinimize size={14} />
        </button>
        <button
          onClick={onToggleMaximize}
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
            <IconRestore size={13} />
          ) : (
            <IconMaximize size={12} />
          )}
        </button>
        <button
          onClick={onClose}
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
          <IconClose size={14} />
        </button>
      </div>
    </div>
  );
}
