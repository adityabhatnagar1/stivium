import { useState, type CSSProperties, type MouseEvent } from "react";
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

export function FileTreeNode({
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
    padding: `6px 10px 6px ${paddingLeft + 2}px`,
    cursor: "pointer",
    color: node.isDirectory ? "var(--color-text)" : "var(--color-text-muted)",
    fontWeight: node.isDirectory ? 600 : 400,
    fontSize: "var(--text-body)",
    display: "flex",
    alignItems: "center",
  };
  const rowClassName = `stv-tree-row${isSelected ? " stv-tree-row--selected" : ""}`;

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
        {node.name}
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
        {node.name}
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
