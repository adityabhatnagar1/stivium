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
        background: "var(--color-surface)",
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
      <div className="stv-lp-seg" role="tablist">
        <button
          onClick={() => onLeftPaneTabChange("workspace")}
          role="tab"
          aria-selected={leftPaneTab === "workspace"}
          className={`stv-lp-seg__btn${leftPaneTab === "workspace" ? " stv-lp-seg__btn--active" : ""}`}
        >
          <IconFolderOpen size={14} />
          Workspace
        </button>

        <button
          onClick={() => {
            if (canUseSearch) onLeftPaneTabChange("search");
          }}
          disabled={!canUseSearch}
          role="tab"
          aria-selected={leftPaneTab === "search"}
          className={`stv-lp-seg__btn${leftPaneTab === "search" ? " stv-lp-seg__btn--active" : ""}`}
        >
          <IconSearch size={14} />
          Search
        </button>
      </div>

      {leftPaneTab === "workspace" || !canUseSearch ? (
        <>
          <div className="stv-lp-section">
            <span
              title={fileTree?.name || "Workspace"}
              className="stv-lp-section__title"
            >
              {fileTree?.name || "Workspace"}
            </span>

            {fileTree && (
              <div className="stv-lp-section__actions">
                <button
                  onClick={onCreateFile}
                  title="New File"
                  aria-label="New File"
                  className="stv-lp-iconbtn"
                >
                  <IconFile size={14} />
                </button>

                <button
                  onClick={onCreateFolder}
                  title="New Folder"
                  aria-label="New Folder"
                  className="stv-lp-iconbtn"
                >
                  <IconFolder size={14} />
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
            <div className="stv-lp-empty">
              <div className="stv-lp-empty__icon" aria-hidden="true">
                <IconFolderOpen size={20} />
              </div>
              <span className="stv-lp-empty__title">No workspace open</span>

              <button
                onClick={onOpenWorkspace}
                className="stv-btn stv-btn--primary stv-lp-cta"
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
