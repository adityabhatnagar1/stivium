import { memo, useState, type CSSProperties, type MouseEvent } from "react";
import type { TreeNode } from "../types";
import { IconFile, IconFolder, IconFolderOpen, IconCaretRight } from "./Icons";

type FileTreeNodeProps = {
  node: TreeNode;
  parentPath: string;
  selectedPath: string | null;
  onSelect: (node: TreeNode, parentPath: string) => void;
  onFileClick: (filePath: string, fileName: string) => void;
  onContextMenu: (
    event: MouseEvent<HTMLDivElement>,
    node: TreeNode,
    parentPath: string,
  ) => void;
  depth?: number;
};

const INDENT_STEP = 12; // px per depth level — kept as a named constant, not a magic number re-typed at each call site

function FileTreeNodeImpl({
  node,
  parentPath,
  selectedPath,
  onSelect,
  onFileClick,
  onContextMenu,
  depth = 0,
}: FileTreeNodeProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const paddingLeft = depth * INDENT_STEP + 8;
  const isSelected = selectedPath === node.path;

  const rowStyle: CSSProperties = {
    padding: `var(--space-1) var(--space-2) var(--space-1) ${paddingLeft}px`,
    margin: "0 var(--space-2)",
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    fontSize: "var(--text-body)",
    letterSpacing: "var(--tracking-body)",
    height: "26px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
  };
  const rowClassName = [
    "stv-tree-row",
    node.isDirectory ? "stv-tree-row--dir" : "",
    isSelected ? "stv-tree-row--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (!node.isDirectory) {
    return (
      <div
        className={rowClassName}
        style={rowStyle}
        role="treeitem"
        aria-selected={isSelected}
        tabIndex={0}
        onClick={() => {
          onSelect(node, parentPath);
          onFileClick(node.path, node.name);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(node, parentPath);
            onFileClick(node.path, node.name);
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect(node, parentPath);
          onContextMenu(event, node, parentPath);
        }}
      >
        <IconFile
          size={13}
          aria-hidden="true"
          style={{ marginRight: "var(--space-2)", flexShrink: 0 }}
        />
        <span className="stv-tree-row__name">{node.name}</span>
      </div>
    );
  }

  return (
    <div role="group">
      <div
        className={rowClassName}
        style={rowStyle}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isOpen}
        aria-label={node.name}
        tabIndex={0}
        onClick={() => {
          onSelect(node, parentPath);
          setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(node, parentPath);
            setIsOpen((prev) => !prev);
          }
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect(node, parentPath);
          onContextMenu(event, node, parentPath);
        }}
      >
        <IconCaretRight
          size={11}
          aria-hidden="true"
          className="stv-tree-caret"
          style={
            {
              marginRight: "var(--space-2)",
              flexShrink: 0,
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            } as CSSProperties
          }
        />
        {isOpen ? (
          <IconFolderOpen
            size={13}
            aria-hidden="true"
            style={{ marginRight: "var(--space-2)", flexShrink: 0 }}
          />
        ) : (
          <IconFolder
            size={13}
            aria-hidden="true"
            style={{ marginRight: "var(--space-2)", flexShrink: 0 }}
          />
        )}
        <span className="stv-tree-row__name">{node.name}</span>
      </div>
      {isOpen &&
        node.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            parentPath={node.path}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onFileClick={onFileClick}
            onContextMenu={onContextMenu}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export const FileTreeNode = memo(FileTreeNodeImpl);
