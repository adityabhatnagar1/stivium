import type { Tab } from "../types";

export function getLanguage(fileName: string): string {
  if (fileName.endsWith(".v") || fileName.endsWith(".sv")) return "verilog";
  if (fileName.endsWith(".vhd") || fileName.endsWith(".vhdl")) return "vhdl";
  if (fileName.endsWith(".py")) return "python";
  if (fileName.endsWith(".json")) return "json";
  return "plaintext";
}

export function resolveActiveTabPath(
  tabs: Tab[],
  activeTabPath: string | null,
): string | null {
  if (activeTabPath && tabs.some((tab) => tab.path === activeTabPath)) {
    return activeTabPath;
  }
  return tabs.length > 0 ? tabs[tabs.length - 1].path : null;
}

function pathComponents(path: string): string[] {
  return path.split(/[\\/]+/).filter(Boolean);
}

export function isPathOrDescendant(path: string, base: string): boolean {
  const pathParts = pathComponents(path);
  const baseParts = pathComponents(base);
  if (pathParts.length < baseParts.length) return false;
  return baseParts.every((part, index) => part === pathParts[index]);
}

export function rebasePath(
  path: string,
  oldBase: string,
  newBase: string,
): string {
  const separator = path.includes("\\") && !path.includes("/") ? "\\" : "/";
  const oldParts = pathComponents(oldBase);
  const pathParts = pathComponents(path);
  const remainder = pathParts.slice(oldParts.length);
  const newParts = pathComponents(newBase);
  return [...newParts, ...remainder].join(separator);
}
