export type CuteBotState =
  | "idle"
  | "hover"
  | "active"
  | "speaking"
  | "notification"
  | "error"
  | "success";

export interface CuteBotColors {
  background: string;
  face: string;
  eye: string;
  accent: string;
  notify: string;
}

export interface CuteBotOptions {
  /** Element the bot will be mounted into. */
  container: HTMLElement;
  /** Size in pixels (width and height). Default 48. */
  size?: number;
  /** Whether the eyes should track the cursor. Default true. */
  eyeTracking?: boolean;
  /** Track mouse across the whole window, or only within the container. Default 'window'. */
  trackingRange?: "window" | "container";
  /** Override any of the default colors. */
  colors?: Partial<CuteBotColors>;
  /** Called whenever the bot's state changes. */
  onStateChange?: (state: CuteBotState, prevState: CuteBotState) => void;
}
