/**
 * Shared types for the Stivium boot screen package.
 */

/** Discrete boot state. Timed in the demo implementation; later these can be
 *  driven by real initialization promises/events emitted by the app shell. */
export type BootState = 'initializing' | 'workspace' | 'tools' | 'ready';

export interface BootStateStep {
  state: BootState;
  /** Status label. Not rendered visually (the boot screen shows no status
   *  copy) — only exposed to assistive tech via the root's aria-label. */
  label: string;
  /** Time (ms) after boot start at which this state becomes active. */
  atMs: number;
}

export interface SpaceRendererOptions {
  /** Approx. number of background stars (density scales with area if unset). */
  starCount?: number;
  /** Respect prefers-reduced-motion: static field, no comets. */
  reducedMotion?: boolean;
  /** Called (rarely) when a comet passes near the given normalized screen
   *  point [0..1, 0..1], used to trigger the logo's atmospheric highlight. */
  onCometNearCenter?: (proximity: number) => void;
  /** Normalized [x, y] (0..1) of the point comets are considered "near". */
  focalPoint?: [number, number];
  /** CSS color used for the comet head/trail glow. Defaults to the same
   *  sage tint as the logo's atmospheric highlight, so a comet passing
   *  near the mark feels like it belongs to the same light source. */
  cometGlowColor?: string;
}

export interface SpaceRenderer {
  start: () => void;
  stop: () => void;
  resize: () => void;
  destroy: () => void;
}
