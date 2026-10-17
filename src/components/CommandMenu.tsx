import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { Tab, TreeNode } from "../types";
import {
  IconSearch,
  IconFile,
  IconPlay,
  IconTerminal,
  IconFolderOpen,
  IconPlus,
  IconSparkle,
} from "./Icons";

type CommandItem = {
  id: string;
  title: string;
  category: "Files" | "Actions" | "Navigation";
  shortcut?: string;
  icon: JSX.Element;
  subtitle?: string;
  action: () => void | Promise<void>;
};

type CommandMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  fileTree: TreeNode | null;
  tabs: Tab[];
  onOpenFile: (path: string, fileName: string) => void;
  onSaveCurrent: () => Promise<void>;
  onSaveAll: () => Promise<void>;
  onRunCurrentFile: () => Promise<void>;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onOpenWorkspace: () => void;
  onCreateTerminal: () => void;
  onToggleAi: () => void;
  onSwitchLeftPaneTab: (tab: "workspace" | "search") => void;
  onFormatDocument?: () => Promise<boolean>;
};

export function CommandMenu({
  isOpen,
  onClose,
  fileTree,
  tabs,
  onOpenFile,
  onSaveCurrent,
  onSaveAll,
  onRunCurrentFile,
  onCreateFile,
  onCreateFolder,
  onOpenWorkspace,
  onCreateTerminal,
  onToggleAi,
  onSwitchLeftPaneTab,
  onFormatDocument,
}: CommandMenuProps): JSX.Element | null {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input whenever dialog opens and clear query
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Recursively collect all files from workspace tree
  const allFiles = useMemo(() => {
    if (!fileTree) return [];
    const files: { name: string; path: string; relPath: string }[] = [];
    const rootPath = fileTree.path;

    function walk(node: TreeNode) {
      if (!node.children) {
        const relPath = node.path.startsWith(rootPath)
          ? node.path.slice(rootPath.length).replace(/^[\\/]/, "")
          : node.name;
        files.push({ name: node.name, path: node.path, relPath });
        return;
      }
      for (const child of node.children) {
        walk(child);
      }
    }

    if (fileTree.children) {
      for (const child of fileTree.children) {
        walk(child);
      }
    }
    return files;
  }, [fileTree]);

  // Build full command item list
  const allItems = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Files from open tabs
    for (const tab of tabs) {
      items.push({
        id: `tab-${tab.path}`,
        title: tab.name,
        subtitle: tab.path,
        category: "Files",
        icon: <IconFile size={14} />,
        action: () => onOpenFile(tab.path, tab.name),
      });
    }

    // 2. Files from workspace tree (excluding already added tabs)
    const tabPaths = new Set(tabs.map((t) => t.path));
    for (const file of allFiles) {
      if (tabPaths.has(file.path)) continue;
      items.push({
        id: `file-${file.path}`,
        title: file.name,
        subtitle: file.relPath !== file.name ? file.relPath : undefined,
        category: "Files",
        icon: <IconFile size={14} />,
        action: () => onOpenFile(file.path, file.name),
      });
    }

    // 3. IDE Actions
    items.push(
      {
        id: "act-save-current",
        title: "Save File",
        category: "Actions",
        shortcut: "Ctrl+S",
        icon: <IconFile size={14} />,
        action: () => void onSaveCurrent(),
      },
      {
        id: "act-save-all",
        title: "Save All Files",
        category: "Actions",
        icon: <IconFile size={14} />,
        action: () => void onSaveAll(),
      },
      {
        id: "act-run",
        title: "Run Current File / Simulation",
        category: "Actions",
        icon: <IconPlay size={14} />,
        action: () => void onRunCurrentFile(),
      },
      {
        id: "act-new-file",
        title: "New File...",
        category: "Actions",
        icon: <IconPlus size={14} />,
        action: onCreateFile,
      },
      {
        id: "act-new-folder",
        title: "New Folder...",
        category: "Actions",
        icon: <IconPlus size={14} />,
        action: onCreateFolder,
      },
      {
        id: "act-open-workspace",
        title: "Open Workspace...",
        category: "Actions",
        icon: <IconFolderOpen size={14} />,
        action: onOpenWorkspace,
      },
      {
        id: "act-new-terminal",
        title: "New Terminal",
        category: "Actions",
        icon: <IconTerminal size={14} />,
        action: onCreateTerminal,
      },
      {
        id: "act-toggle-ai",
        title: "Toggle AI Workspace / Pet",
        category: "Actions",
        icon: <IconSparkle size={14} />,
        action: onToggleAi,
      },
      {
        id: "act-search-files",
        title: "Find & Replace in Files",
        category: "Navigation",
        icon: <IconSearch size={14} />,
        action: () => onSwitchLeftPaneTab("search"),
      },
      {
        id: "act-file-explorer",
        title: "Show File Explorer",
        category: "Navigation",
        icon: <IconFolderOpen size={14} />,
        action: () => onSwitchLeftPaneTab("workspace"),
      },
    );

    if (onFormatDocument) {
      items.push({
        id: "act-format",
        title: "Format Document",
        category: "Actions",
        shortcut: "Alt+Shift+L",
        icon: <IconFile size={14} />,
        action: () => void onFormatDocument(),
      });
    }

    return items;
  }, [
    tabs,
    allFiles,
    onOpenFile,
    onSaveCurrent,
    onSaveAll,
    onRunCurrentFile,
    onCreateFile,
    onCreateFolder,
    onOpenWorkspace,
    onCreateTerminal,
    onToggleAi,
    onSwitchLeftPaneTab,
    onFormatDocument,
  ]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return allItems.slice(0, 30);

    return allItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(clean) ||
          (item.subtitle && item.subtitle.toLowerCase().includes(clean)) ||
          item.category.toLowerCase().includes(clean)
        );
      })
      .slice(0, 30);
  }, [allItems, query]);

  // Clamp selected index
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (filteredItems.length === 0) return 0;
      return Math.min(prev, filteredItems.length - 1);
    });
  }, [filteredItems.length]);

  // Auto-scroll selected item into view
  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;
    const selectedEl = listEl.querySelector<HTMLElement>(
      `[data-index="${selectedIndex}"]`,
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filteredItems.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filteredItems.length === 0) return;
      setSelectedIndex((prev) =>
        prev === 0 ? filteredItems.length - 1 : prev - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const current = filteredItems[selectedIndex];
      if (current) {
        onClose();
        void current.action();
      }
    }
  };

  const handleItemClick = (item: CommandItem) => {
    onClose();
    void item.action();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        zIndex: "var(--z-index-command-scrim)" as unknown as number,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "12vh",
      }}
    >
      <div
        onClick={(e: MouseEvent) => e.stopPropagation()}
        style={{
          width: "560px",
          maxWidth: "92vw",
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border-secondary)",
          borderRadius: "var(--radius-lg)",
          boxShadow:
            "0 20px 48px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: "var(--z-index-command-menu)" as unknown as number,
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 14px",
            height: "46px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
          }}
        >
          <div style={{ color: "var(--color-text-muted)", display: "flex" }}>
            <IconSearch size={16} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search files…"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--color-text)",
              fontSize: "14px",
              fontFamily: "var(--font-ui)",
              letterSpacing: "var(--tracking-body)",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "2px 5px",
              borderRadius: "4px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            ESC
          </span>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            maxHeight: "340px",
            overflowY: "auto",
            padding: "6px",
          }}
        >
          {filteredItems.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "13px",
              }}
            >
              No matching commands or files found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 10px",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    backgroundColor: isSelected
                      ? "var(--color-surface-container)"
                      : "transparent",
                    color: isSelected
                      ? "var(--color-text)"
                      : "var(--color-text-secondary)",
                    transition: "background-color 60ms ease, color 60ms ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        color: isSelected
                          ? "var(--color-accent)"
                          : "var(--color-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? 510 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--color-text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "180px",
                        }}
                      >
                        {item.subtitle}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                      marginLeft: "10px",
                    }}
                  >
                    {item.shortcut ? (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "1px 5px",
                          borderRadius: "4px",
                          background: isSelected
                            ? "rgba(255, 255, 255, 0.12)"
                            : "rgba(255, 255, 255, 0.05)",
                          color: isSelected
                            ? "var(--color-text)"
                            : "var(--color-text-muted)",
                        }}
                      >
                        {item.shortcut}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div
          style={{
            height: "26px",
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "0 12px",
            fontSize: "11px",
            color: "var(--color-text-muted)",
          }}
        >
          <span>
            <strong style={{ color: "var(--color-text-secondary)" }}>↑↓</strong>{" "}
            Navigate
          </span>
          <span>
            <strong style={{ color: "var(--color-text-secondary)" }}>↵</strong>{" "}
            Select
          </span>
          <span>
            <strong style={{ color: "var(--color-text-secondary)" }}>
              ESC
            </strong>{" "}
            Dismiss
          </span>
        </div>
      </div>
    </div>
  );
}
