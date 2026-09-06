// Every state the pet can visually be in. "priority" below defines what
// wins when more than one is true at once (e.g. the AI is "working" while
// the user is also "dragging" the pet — dragging wins, since it's a
// direct manual interaction).
export type PetState =
  | "idle"
  | "hover"
  | "click"
  | "dragging"
  | "thinking"
  | "working"
  | "ready"
  | "error"
  | "needsInput"
  | "review";

// Lower index = higher priority (shown first when multiple are active).
export const PET_STATE_PRIORITY: PetState[] = [
  "dragging",
  "click",
  "error",
  "needsInput",
  "review",
  "working",
  "thinking",
  "ready",
  "hover",
  "idle",
];

export function resolvePetState(active: Set<PetState>): PetState {
  for (const state of PET_STATE_PRIORITY) {
    if (active.has(state)) return state;
  }
  return "idle";
}
