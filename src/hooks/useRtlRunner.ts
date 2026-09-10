import { useState } from "react";
import type { Tab } from "../types";
import { getLanguage } from "../utils/editor";

type UseRtlRunnerParams = {
  activeTab: Tab | undefined;
  onRun: () => void;
};

type UseRtlRunnerResult = {
  isRunning: boolean;
  canRun: boolean;
  errorSignal: number;
  successSignal: number;
  runCurrentFile: () => Promise<void>;
};

/**
 * Stage 2 - "Run It". Sends the *current Monaco buffer contents* (not the
 * possibly-stale on-disk copy) for the active tab to the Rust backend, which
 * compiles it with iverilog and executes it with vvp. All output is streamed
 * into Stivium's existing Output console via the `terminal-output` event
 * that useTerminalManager already listens on - this hook only tracks
 * in-flight state for the Run button.
 */
export function useRtlRunner({
  activeTab,
  onRun,
}: UseRtlRunnerParams): UseRtlRunnerResult {
  const [isRunning, setIsRunning] = useState(false);
  const [errorSignal, setErrorSignal] = useState(0);
  const [successSignal, setSuccessSignal] = useState(0);

  const isVerilog =
    Boolean(activeTab) && getLanguage(activeTab?.name ?? "") === "verilog";
  const canRun = isVerilog && !isRunning;

  const runCurrentFile = async () => {
    if (!activeTab || !isVerilog || isRunning) return;
    setIsRunning(true);
    onRun();
    try {
      const result = await window.api.runRtl(activeTab.path, activeTab.content);
      if (result.success) {
        setSuccessSignal((n) => n + 1);
      } else {
        setErrorSignal((n) => n + 1);
      }
    } catch {
      setErrorSignal((n) => n + 1);
    } finally {
      setIsRunning(false);
    }
  };

  return { isRunning, canRun, errorSignal, successSignal, runCurrentFile };
}
