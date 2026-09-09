import type { MouseEvent } from "react";
import { FileTreeNode } from "./FileTreeNode";
import {
  IconFolderOpen,
  IconSearch,
  IconFile,
  IconFolder,
  IconReplace,
} from "./Icons";
import type { SearchResult, SelectedNode, TreeNode } from "../types";

type LeftPaneProps = {
  fileTree: TreeNode | null;
  leftPaneTab: "workspace" | "search";
  selectedNode: SelectedNode | null;
  searchQuery: string;
  replaceQuery: string;
  searchResults: SearchResult[];
  onLeftPaneTabChange: (tab: "workspace" | "search") => void;
  onSearchQueryChange: (value: string) => void;
  onReplaceQueryChange: (value: string) => void;
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onOpenWorkspace: () => void;
  onOpenSearchResult: (path: string) => void;
  onFind: () => void;
  onReplaceAll: () => void;
  onOpenContextMenu: (
    event: MouseEvent<HTMLDivElement>,
    node: TreeNode | null,
    parentPath: string | null,
  ) => void;
  onSelectNode: (node: TreeNode, parentPath: string) => void;
  onFileClick: (filePath: string, fileName: string) => void;
};

export function LeftPane({
  fileTree,
  leftPaneTab,
  selectedNode,
  searchQuery,
  replaceQuery,
  searchResults,
  onLeftPaneTabChange,
  onSearchQueryChange,
  onReplaceQueryChange,
  onCreateFile,
  onCreateFolder,
  onOpenWorkspace,
  onOpenSearchResult,
  onFind,
  onReplaceAll,
  onOpenContextMenu,
  onSelectNode,
  onFileClick,
}: LeftPaneProps): JSX.Element {
  const canUseSearch = Boolean(fileTree);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        background: "var(--color-surface-2)",
        borderRight: "1px solid var(--color-border)",
        overflowY: "auto",
        paddingTop: "8px",
        display: "flex",
        flexDirection: "column",
      }}
      onContextMenu={(event) => {
        if (!fileTree || leftPaneTab !== "workspace") return;
        if (event.currentTarget !== event.target) return;
        event.preventDefault();
        onOpenContextMenu(event, null, null);
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "2px",
          margin: "0 var(--space-2) var(--space-3) var(--space-2)",
          padding: "2px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <button
          onClick={() => onLeftPaneTabChange("workspace")}
          className="stv-tab"
          style={{
            flex: 1,
            background:
              leftPaneTab === "workspace"
                ? "var(--color-surface-elevated)"
                : "transparent",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "var(--color-text)",
            padding: "6px 8px",
            cursor: "pointer",
          }}
        >
          <IconFolderOpen size={14} style={{ marginRight: "6px" }} />
          Workspace
        </button>

        <button
          onClick={() => {
            if (canUseSearch) onLeftPaneTabChange("search");
          }}
          disabled={!canUseSearch}
          className="stv-tab"
          style={{
            flex: 1,
            background:
              leftPaneTab === "search"
                ? "var(--color-surface-elevated)"
                : "transparent",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: canUseSearch
              ? "var(--color-text)"
              : "var(--color-text-muted)",
            padding: "6px 8px",
            cursor: canUseSearch ? "pointer" : "not-allowed",
            opacity: canUseSearch ? 1 : 0.75,
          }}
        >
          <IconSearch size={14} style={{ marginRight: "6px" }} />
          Search
        </button>
      </div>

      {leftPaneTab === "workspace" || !canUseSearch ? (
        <>
          <div
            style={{
              padding: "0 var(--space-2) var(--space-2) var(--space-2)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--color-border)",
              marginBottom: "var(--space-2)",
            }}
          >
            <span
              title={fileTree?.name || "Workspace"}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "190px",
                paddingLeft: "4px",
              }}
            >
              {fileTree?.name || "Workspace"}
            </span>

            {fileTree && (
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={onCreateFile}
                  title="New File"
                  className="stv-icon-btn"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <IconFile size={13} />
                </button>

                <button
                  onClick={onCreateFolder}
                  title="New Folder"
                  className="stv-icon-btn"
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--color-text)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <IconFolder size={13} />
                </button>
              </div>
            )}
          </div>

          {fileTree ? (
            fileTree.children?.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                parentPath={fileTree.path}
                selectedPath={selectedNode?.node.path ?? null}
                onSelect={onSelectNode}
                onFileClick={onFileClick}
                onContextMenu={onOpenContextMenu}
                depth={0}
              />
            ))
          ) : (
            <div
              style={{
                padding: "20px",
                color: "var(--color-text-muted)",
                fontSize: "13px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <span>No workspace open</span>

              <button
                onClick={onOpenWorkspace}
                className="stv-btn stv-btn--primary"
                style={{
                  padding: "6px 10px",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                }}
              >
                Open Workspace
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: "var(--space-3)" }}>
          <div
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--space-2)",
              color: "var(--color-text-muted)",
            }}
          >
            Find
          </div>

          <input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search text"
            className="stv-input"
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginBottom: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              background: "var(--color-bg)",
            }}
          />

          <div
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "var(--space-2)",
              color: "var(--color-text-muted)",
            }}
          >
            Replace
          </div>

          <input
            value={replaceQuery}
            onChange={(e) => onReplaceQueryChange(e.target.value)}
            placeholder="Replace text"
            className="stv-input"
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginBottom: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              background: "var(--color-bg)",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              marginTop: "var(--space-4)",
              marginBottom: "var(--space-3)",
            }}
          >
            <button
              onClick={onFind}
              className="stv-btn stv-btn--primary"
              style={{
                borderRadius: "var(--radius-md)",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              <IconSearch size={14} style={{ marginRight: "6px" }} />
              Find
            </button>

            <button
              onClick={onReplaceAll}
              className="stv-btn stv-btn--secondary"
              style={{
                borderRadius: "var(--radius-md)",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              <IconReplace size={14} style={{ marginRight: "6px" }} />
              Replace All
            </button>
          </div>

          <div
            style={{
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-2)",
            }}
          >
            Results ({searchResults.length})
          </div>

          <div>
            {searchResults.map((result) => (
              <div
                key={result.path}
                onClick={() => onOpenSearchResult(result.path)}
                className="stv-tree-row"
                style={{
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-xs)",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                <div style={{ color: "var(--color-text)" }}>
                  {result.path.split(/[\\/]/).slice(-1)[0]}
                </div>

                <div
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: "11px",
                  }}
                >
                  {result.count} matches
                </div>

                {result.matches.slice(0, 2).map((match) => (
                  <div
                    key={`${result.path}-${match.line}`}
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "11px",
                    }}
                  >
                    {match.line}: {match.preview}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
