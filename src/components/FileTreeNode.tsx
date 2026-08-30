import { useState, type CSSProperties, type MouseEvent } from "react";
import type { TreeNode } from "../types";
import {
  IconFile,
  IconFolder,
  IconFolderOpen,
  IconCaretDown,
  IconCaretRight,
} from "./Icons";

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
  const paddingLeft = depth * 12 + 8;
  const isSelected = selectedPath === node.path;

  const rowStyle: CSSProperties = {
    padding: `6px 10px 6px ${paddingLeft + 2}px`,
    cursor: "pointer",
    color: node.isDirectory ? "var(--color-text)" : "var(--color-text-muted)",
    fontWeight: node.isDirectory ? "bold" : "normal",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
  };
  const rowClassName = `stv-tree-row${isSelected ? " stv-tree-row--selected" : ""}`;

  if (!node.isDirectory) {
    return (
      <div
        className={rowClassName}
        style={rowStyle}
        onClick={() => {
          onSelect(node, parentPath);
          onFileClick(node.path, node.name);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect(node, parentPath);
          onContextMenu(event, node, parentPath);
        }}
      >
        <IconFile size={13} style={{ marginRight: "6px", flexShrink: 0 }} />
        {node.name}
      </div>
    );
  }

  return (
    <div>
      <div
        className={rowClassName}
        style={rowStyle}
        onClick={() => {
          onSelect(node, parentPath);
          setIsOpen((prev) => !prev);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onSelect(node, parentPath);
          onContextMenu(event, node, parentPath);
        }}
      >
        {isOpen ? (
          <IconCaretDown
            size={11}
            style={{ marginRight: "6px", flexShrink: 0 }}
          />
        ) : (
          <IconCaretRight
            size={11}
            style={{ marginRight: "6px", flexShrink: 0 }}
          />
        )}
        {isOpen ? (
          <IconFolderOpen
            size={13}
            style={{ marginRight: "6px", flexShrink: 0 }}
          />
        ) : (
          <IconFolder size={13} style={{ marginRight: "6px", flexShrink: 0 }} />
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
