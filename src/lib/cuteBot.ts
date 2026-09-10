import { CuteBotOptions, CuteBotState, CuteBotColors } from "./cuteBotTypes";
import { CUTEBOT_CSS } from "./cuteBotStyles";

export type {
  CuteBotOptions,
  CuteBotState,
  CuteBotColors,
} from "./cuteBotTypes";

const DEFAULT_COLORS: CuteBotColors = {
  background: "#111113",
  face: "#ffffff",
  eye: "#111113",
  accent: "#ff5252",
  notify: "#6c7bff",
};

// Baseline eye "openness" per state. 1 = fully open, lower = squint.
const REST_SCALE: Partial<Record<CuteBotState, number>> = {
  active: 0.72,
  error: 0.85,
};

let styleInjected = false;
function injectStyles(): void {
  if (styleInjected || typeof document === "undefined") return;
  styleInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-cutebot", "");
  style.textContent = CUTEBOT_CSS;
  document.head.appendChild(style);
}

interface ResolvedOptions {
  container: HTMLElement;
  size: number;
  eyeTracking: boolean;
  trackingRange: "window" | "container";
  colors: CuteBotColors;
  onStateChange?: CuteBotOptions["onStateChange"];
}

export class CuteBot {
  readonly root: HTMLDivElement;

  private wobble: HTMLDivElement;
  private eyeL: HTMLDivElement;
  private eyeR: HTMLDivElement;

  private opts: ResolvedOptions;
  private state: CuteBotState = "idle";

  private eyeTx = 0;
  private eyeTy = 0;
  private blinkScale = 1;

  private blinkTimer?: number;
  private revertTimer?: number;
  private destroyed = false;

  private handleMouseMoveBound = (e: MouseEvent): void =>
    this.handleMouseMove(e);
  private handleEnterBound = (): void => {
    if (this.state === "idle") this.setState("hover");
  };
  private handleLeaveBound = (): void => {
    if (this.state === "hover") this.setState("idle");
  };

  constructor(options: CuteBotOptions) {
    injectStyles();

    this.opts = {
      container: options.container,
      size: options.size ?? 48,
      eyeTracking: options.eyeTracking ?? true,
      trackingRange: options.trackingRange ?? "window",
      colors: { ...DEFAULT_COLORS, ...(options.colors ?? {}) },
      onStateChange: options.onStateChange,
    };

    this.root = document.createElement("div");
    this.root.className = "cb-root cb-state-idle";
    this.root.style.setProperty("--cb-size", `${this.opts.size}px`);
    this.root.style.setProperty("--cb-bg", this.opts.colors.background);
    this.root.style.setProperty("--cb-face", this.opts.colors.face);
    this.root.style.setProperty("--cb-eye", this.opts.colors.eye);
    this.root.style.setProperty("--cb-accent", this.opts.colors.accent);
    this.root.style.setProperty("--cb-notify", this.opts.colors.notify);

    this.root.innerHTML = `
      <div class="cb-wobble">
        <div class="cb-face">
          <div class="cb-eye cb-eye-l"></div>
          <div class="cb-eye cb-eye-r"></div>
          <div class="cb-mouth"></div>
        </div>
        <div class="cb-dots"><span></span><span></span><span></span></div>
        <div class="cb-badge"></div>
        <div class="cb-spark cb-spark-1"></div>
        <div class="cb-spark cb-spark-2"></div>
      </div>
    `;

    this.wobble = this.root.querySelector(".cb-wobble") as HTMLDivElement;
    this.eyeL = this.root.querySelector(".cb-eye-l") as HTMLDivElement;
    this.eyeR = this.root.querySelector(".cb-eye-r") as HTMLDivElement;

    this.opts.container.appendChild(this.root);

    this.root.addEventListener("mouseenter", this.handleEnterBound);
    this.root.addEventListener("mouseleave", this.handleLeaveBound);

    if (this.opts.eyeTracking) {
      const target: HTMLElement | Window =
        this.opts.trackingRange === "window" ? window : this.opts.container;
      target.addEventListener(
        "mousemove",
        this.handleMouseMoveBound as EventListener,
      );
    }

    this.renderEyes();
    this.scheduleBlink();
  }

  // ---- public API -------------------------------------------------------

  /** Switch to a state. Pass `revertAfter` (ms) to auto-return to idle. */
  setState(state: CuteBotState, opts?: { revertAfter?: number }): void {
    if (this.destroyed) return;
    if (this.revertTimer) {
      window.clearTimeout(this.revertTimer);
      this.revertTimer = undefined;
    }
    const prev = this.state;
    this.state = state;
    this.root.className = `cb-root cb-state-${state}`;
    this.renderEyes();
    this.opts.onStateChange?.(state, prev);

    if (opts?.revertAfter) {
      this.revertTimer = window.setTimeout(
        () => this.setState("idle"),
        opts.revertAfter,
      );
    }
  }

  getState(): CuteBotState {
    return this.state;
  }

  /** Thinking / working indicator (bouncing dots + squint). */
  think(durationMs = 1400): void {
    this.setState("active", { revertAfter: durationMs });
  }

  /** Responding indicator (mouth talks). */
  speak(durationMs = 1600): void {
    this.setState("speaking", { revertAfter: durationMs });
  }

  /** New-message badge. */
  notify(durationMs = 2200): void {
    this.setState("notification", { revertAfter: durationMs });
  }

  /** Cute error reaction: shake + red marks. Great for lint/runtime errors. */
  flashError(durationMs = 1100): void {
    this.setState("error", { revertAfter: durationMs });
  }

  /** Cute success reaction: bounce + gold sparkle. Great for a passing test/build. */
  flashSuccess(durationMs = 1100): void {
    this.setState("success", { revertAfter: durationMs });
  }

  /** Remove listeners, timers and the DOM node. */
  destroy(): void {
    this.destroyed = true;
    if (this.blinkTimer) window.clearTimeout(this.blinkTimer);
    if (this.revertTimer) window.clearTimeout(this.revertTimer);
    if (this.opts.eyeTracking) {
      const target: HTMLElement | Window =
        this.opts.trackingRange === "window" ? window : this.opts.container;
      target.removeEventListener(
        "mousemove",
        this.handleMouseMoveBound as EventListener,
      );
    }
    this.root.removeEventListener("mouseenter", this.handleEnterBound);
    this.root.removeEventListener("mouseleave", this.handleLeaveBound);
    this.root.remove();
  }

  // ---- internals ----------------------------------------------------------

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.root.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy) || 1;

    // small cute range so the pupils never leave the eye
    const maxOffset = this.opts.size * 0.045;
    const pull = Math.min(1, dist / 200);

    this.eyeTx = (dx / dist) * maxOffset * pull;
    this.eyeTy = (dy / dist) * maxOffset * pull;
    this.renderEyes();
  }

  private renderEyes(): void {
    const rest = REST_SCALE[this.state] ?? 1;
    const scaleY = this.blinkScale === 1 ? rest : this.blinkScale;
    const t = `translate(${this.eyeTx.toFixed(2)}px, ${this.eyeTy.toFixed(2)}px) scaleY(${scaleY})`;
    this.eyeL.style.transform = t;
    this.eyeR.style.transform = t;
  }

  private scheduleBlink(): void {
    if (this.destroyed) return;
    const delay = 1800 + Math.random() * 2600;
    this.blinkTimer = window.setTimeout(() => {
      this.blink();
      this.scheduleBlink();
    }, delay);
  }

  private blink(): void {
    if (this.destroyed) return;
    this.blinkScale = 0.08;
    this.renderEyes();
    window.setTimeout(() => {
      this.blinkScale = 1;
      this.renderEyes();
    }, 110);
  }
}
