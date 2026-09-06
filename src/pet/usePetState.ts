import { useMemo, useState } from "react";
import type { PetState } from "./types";
import { resolvePetState } from "./types";

type UsePetStateResult = {
  petState: PetState;
  /** AI-lifecycle state, driven by real backend events (see useAiSession). */
  setAiState: (
    state:
      | "thinking"
      | "working"
      | "ready"
      | "error"
      | "needsInput"
      | "review"
      | null,
  ) => void;
  setHovering: (hovering: boolean) => void;
  setClicking: (clicking: boolean) => void;
  setDragging: (dragging: boolean) => void;
  /** Debug-only: force a state regardless of real inputs. Pass null to release. */
  forcedState: PetState | null;
  setForcedState: (state: PetState | null) => void;
};

/**
 * Centralizes pet state so it's derived from real signals (AI lifecycle,
 * pointer interaction) via a priority order, rather than being one big
 * ad-hoc `useState<PetState>` that every event handler mutates directly —
 * that's what caused the "priority handling when multiple AI states
 * exist" requirement in the report to be genuinely necessary.
 */
export function usePetState(): UsePetStateResult {
  const [aiState, setAiStateRaw] = useState<PetState | null>(null);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [forcedState, setForcedState] = useState<PetState | null>(null);

  const petState = useMemo(() => {
    if (forcedState) return forcedState;
    const active = new Set<PetState>();
    if (dragging) active.add("dragging");
    if (clicking) active.add("click");
    if (aiState) active.add(aiState);
    if (hovering) active.add("hover");
    active.add("idle");
    return resolvePetState(active);
  }, [forcedState, dragging, clicking, aiState, hovering]);

  return {
    petState,
    setAiState: (state) => setAiStateRaw(state),
    setHovering,
    setClicking,
    setDragging,
    forcedState,
    setForcedState,
  };
}
