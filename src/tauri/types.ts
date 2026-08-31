export type AppMenuId = "file" | "edit" | "selection" | "view" | "help";

export type DirTreeNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: DirTreeNode[];
};

export type FindInFilesResult = {
  path: string;
  count: number;
  matches: Array<{ line: number; preview: string }>;
};

export type LspSpawnOptions = {
  id: string;
  server: string;
  workspaceRoot?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
};

export type LspSpawnResult =
  | { ok: true; id: string; pid: number; command: string; args: string[] }
  | { ok: false; id: string; error: string };

export type LspExitInfo = { code: number | null; signal: string | null };

export type RunRtlResult = { success: boolean };
