/// <reference types="vite/client" />
import type * as React from "react";
import type {
  AppMenuId,
  DirTreeNode,
  FindInFilesResult,
  LspExitInfo,
  LspSpawnOptions,
  LspSpawnResult,
  RunRtlResult,
  TerminalExitInfo,
} from "./tauri/types";

declare global {
  namespace JSX {
    type Element = React.JSX.Element;
  }

  interface Window {
    api: {
      onTerminalOutput: (callback: (data: string) => void) => void;
      openFolder: () => Promise<DirTreeNode | null>;
      getLastWorkspace: () => Promise<string | null>;
      setLastWorkspace: (workspacePath: string | null) => Promise<boolean>;
      readDirTree: (dirPath: string) => Promise<DirTreeNode>;
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      createFile: (dirPath: string, name: string) => Promise<boolean>;
      createFolder: (dirPath: string, name: string) => Promise<boolean>;
      renamePath: (targetPath: string, newName: string) => Promise<boolean>;
      deletePath: (targetPath: string) => Promise<boolean>;
      pastePath: (
        sourcePath: string,
        destinationDir: string,
        cut: boolean,
      ) => Promise<boolean>;
      findInFiles: (
        rootDir: string,
        query: string,
      ) => Promise<FindInFilesResult[]>;
      replaceInFiles: (
        rootDir: string,
        query: string,
        replacement: string,
      ) => Promise<number>;
      spawnTerminal: (id: string, cwd?: string) => Promise<string>;
      writeTerminal: (id: string, data: string) => void;
      resizeTerminal: (id: string, cols: number, rows: number) => void;
      killTerminal: (id: string) => void;
      onTerminalData: (id: string, callback: (data: string) => void) => void;
      onTerminalExit: (
        callback: (info: TerminalExitInfo) => void,
      ) => () => void;
      runRtl: (filePath: string, source: string) => Promise<RunRtlResult>;
      minimizeWindow: () => void;
      toggleMaximizeWindow: () => void;
      closeWindow: () => void;
      isWindowMaximized: () => Promise<boolean>;
      showAppMenu: (menuId: AppMenuId, x?: number, y?: number) => Promise<void>;
      onMenuOpenWorkspace: (callback: () => void) => void;
      onMenuCloseWorkspace: (callback: () => void) => void;
      onMenuSaveCurrent: (callback: () => void) => void;
      onMenuSaveAll: (callback: () => void) => void;
      onMenuOpenSearch: (callback: (replaceMode: boolean) => void) => void;
    };
    lsp: {
      spawn: (options: LspSpawnOptions) => Promise<LspSpawnResult>;
      write: (id: string, payloadBase64: string) => void;
      stop: (id: string) => void;
      onData: (
        id: string,
        callback: (payloadBase64: string) => void,
      ) => () => void;
      onStderr: (id: string, callback: (text: string) => void) => () => void;
      onExit: (id: string, callback: (info: LspExitInfo) => void) => () => void;
    };
  }
}

export {};
