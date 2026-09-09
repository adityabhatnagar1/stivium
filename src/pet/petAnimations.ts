import type { PetState } from "./types";

/**
 * Centralized contract between `PetState` (semantic, AI-lifecycle-driven)
 * and the actual Atiyah spritesheet (`../assets/pet-atiyah-spritesheet.webp`,
 * supplied via `atiyah.codex-pet.zip`, id "atiyah" per its `pet.json`).
 *
 * The sheet ships with NO frame/animation metadata beyond id/description
 * (its `pet.json` only has `id`, `displayName`, `description`,
 * `spritesheetPath`, `spriteVersionNumber`, `kind`) — there are no named
 * animations to read programmatically. These row/frame numbers were
 * determined by visually inspecting the sheet (1536x2288px, an 8-column x
 * 11-row grid of 192x208px native cells; rows are not fully packed — see
 * `frameCount` below for how many of the 8 columns each row actually
 * uses).
 *
 * Nothing here claims the sheet contains a "run", "jump", or "fail"
 * animation, because it doesn't. Every mapping below is the closest
 * available Atiyah pose to the requested semantic state, chosen by intent:
 *
 *   idle       -> row 0  "sitting, blinking"      (calm baseline pose)
 *   hover      -> row 3  "waving"                 (quick, one very short attention beat)
 *   click      -> row 10 "head-turn reveal"        (a one-shot "noticed you" beat)
 *   dragging   -> row 2  "rowing stroke B"          (continuous motion while being moved)
 *   thinking   -> row 8  "hand to chin"            (pondering pose)
 *   working    -> row 1  "rowing stroke A"          (continuous active motion)
 *   ready      -> row 6  "open-palm presenting"     (one-shot "here you go")
 *   error      -> row 4  "uneasy / wavering mouth"  (closest calm-negative expression)
 *   needsInput -> row 3  "waving"                   (looped, persistent attention-getting)
 *   review     -> row 9  "head-turn look/consider"  (looped "examining" beat)
 *
 * Rows 5 and 7 (both additional blink/idle-variant cycles) are present on
 * the sheet but unused by V1 — left available here as `UNUSED_ATIYAH_ROWS`
 * for a future idle-variety pass, per "build a clean mapping layer so
 * unused states can be added later without rewriting the renderer."
 *
 * RENDERING: the actual per-frame stepping is done in pure CSS
 * (`src/assets/pet.css`, `.stv-pet-sprite--<state>`) via
 * `background-position` + `steps()` keyframes — no JS/RAF per frame, no
 * React re-render per frame. The numbers below and the CSS values must be
 * kept in sync by hand; each CSS rule has a `// petAnimations: <state>`
 * comment pointing back here.
 */

/** Native spritesheet grid (before any display-time scaling). */
export const ATIYAH_SHEET_COLUMNS = 8;
export const ATIYAH_SHEET_ROWS = 9;
export const ATIYAH_NATIVE_FRAME_WIDTH = 192;
export const ATIYAH_NATIVE_FRAME_HEIGHT = 208;

/**
 * Display scale applied to the sheet. 0.25 => 48x52px per frame, which
 * keeps the on-screen pet close to the previous placeholder's 48px box
 * while preserving Atiyah's real (non-square) aspect ratio instead of
 * stretching it to a square.
 */
export const ATIYAH_DISPLAY_SCALE = 0.35;
export const PET_FRAME_WIDTH = Math.round(
  ATIYAH_NATIVE_FRAME_WIDTH * ATIYAH_DISPLAY_SCALE,
); // 48px
export const PET_FRAME_HEIGHT = Math.round(
  ATIYAH_NATIVE_FRAME_HEIGHT * ATIYAH_DISPLAY_SCALE,
); // 52px

export type PetAnimationDef = {
  /** 0-indexed row on the Atiyah sheet. */
  row: number;
  /** How many of the 8 columns in that row are real (non-empty) frames. */
  frameCount: number;
  /** Full loop duration in ms for one pass through `frameCount` frames. */
  durationMs: number;
  /** Whether the animation repeats while the state is active. */
  loop: boolean;
};

/** Every `PetState` mapped to the closest real Atiyah pose. */
export const PET_ANIMATIONS: Record<PetState, PetAnimationDef> = {
  idle: { row: 0, frameCount: 6, durationMs: 3200, loop: true },
  hover: { row: 3, frameCount: 4, durationMs: 800, loop: true },
  click: { row: 8, frameCount: 6, durationMs: 200, loop: false },
  dragging: { row: 1, frameCount: 8, durationMs: 500, loop: true },
  thinking: { row: 6, frameCount: 6, durationMs: 1600, loop: true },
  working: { row: 2, frameCount: 8, durationMs: 550, loop: true },
  ready: { row: 3, frameCount: 4, durationMs: 600, loop: false },
  error: { row: 4, frameCount: 5, durationMs: 500, loop: false },
  needsInput: { row: 3, frameCount: 4, durationMs: 1000, loop: true },
  review: { row: 8, frameCount: 6, durationMs: 1800, loop: true },
};

/** Rows present on the sheet but not mapped to any V1 state yet. */
export const UNUSED_ATIYAH_ROWS = [5, 7] as const;
