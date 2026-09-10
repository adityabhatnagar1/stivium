import React, { useEffect, useRef, useState, useCallback } from "react";
import { createSpaceRenderer } from "./spaceRenderer";
import type { BootState, BootStateStep, SpaceRenderer } from "./bootTypes";
import "./BootScreen.css";

/**
 * The boot logo is inlined (rather than loaded via <img>) so each facet
 * group can be animated independently by BootScreen.css during assembly.
 * Geometry/colors are sourced directly from stivium-boot-logo.svg — keep
 * the two in sync if the mark changes.
 */
const BOOT_LOGO_FACETS: Array<{ id: number; d: string; fill: string }> = [
  { id: 1, d: "M75,78 L75,30 L116.6,54 Z", fill: "#C3D68E" },
  { id: 2, d: "M75,78 L116.6,54 L116.6,102 Z", fill: "#93AC5B" },
  { id: 3, d: "M75,78 L116.6,102 L75,126 Z", fill: "#C3D68E" },
  { id: 4, d: "M75,78 L75,126 L33.4,102 Z", fill: "#93AC5B" },
  { id: 5, d: "M75,78 L33.4,102 L33.4,54 Z", fill: "#C3D68E" },
  { id: 6, d: "M75,78 L33.4,54 L75,30 Z", fill: "#93AC5B" },
];

/** Same tint as the logo's atmospheric highlight, handed to the renderer so
 *  passing comets glow with the mark's own light rather than generic white. */
const COMET_GLOW = "rgba(195, 214, 142, 0.9)";

export interface BootScreenProps {
  /** Called once the boot sequence (or skip) has finished. */
  onComplete?: () => void;
  /** Skip straight to the completed state (e.g. fast relaunch). */
  skip?: boolean;
}

/**
 * Demo timeline mapping boot states to elapsed time. This is a stand-in for
 * real initialization — replace `atMs` gating with actual promise/event
 * resolution later (see README.md, "Replacing timed states"). The labels are
 * not shown as on-screen copy — the mark itself (assembling, then spinning
 * while work happens, then settling) is the only "status" a viewer sees;
 * `label` exists purely for the aria-live announcement.
 */
const DEMO_STEPS: BootStateStep[] = [
  { state: "initializing", label: "Initializing workspace", atMs: 0 },
  { state: "workspace", label: "Loading workspace", atMs: 900 },
  { state: "tools", label: "Loading tools", atMs: 1800 },
  { state: "ready", label: "Ready", atMs: 3000 },
];

const EXIT_DELAY_MS = 3600;
const EXIT_TRANSITION_MS = 380;

export default function BootScreen({
  onComplete,
  skip = false,
}: BootScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<SpaceRenderer | null>(null);
  const logoElRef = useRef<HTMLDivElement | null>(null);
  const highlightCooldownRef = useRef(0);

  const [phase, setPhase] = useState<
    "assembling" | "settled" | "exiting" | "done"
  >(skip ? "done" : "assembling");
  const [bootState, setBootState] = useState<BootState>(
    skip ? "ready" : "initializing",
  );
  const [statusLabel, setStatusLabel] = useState<string>(
    skip ? "Ready" : DEMO_STEPS[0].label,
  );

  const isReady = bootState === "ready";

  const handleCometNearCenter = useCallback((proximity: number) => {
    const now = performance.now();
    if (now < highlightCooldownRef.current) return;
    highlightCooldownRef.current = now + 4000;
    const el = logoElRef.current;
    if (!el) return;
    el.style.setProperty(
      "--sbl-highlight-strength",
      String(Math.min(1, proximity)),
    );
    el.classList.remove("sbl-atmos-highlight");
    // Force reflow so the animation can be re-triggered on subsequent passes.
    void el.offsetWidth;
    el.classList.add("sbl-atmos-highlight");
  }, []);

  // Renderer lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const renderer = createSpaceRenderer(canvas, {
      reducedMotion: !!reducedMotion,
      focalPoint: [0.5, 0.42],
      onCometNearCenter: handleCometNearCenter,
      cometGlowColor: COMET_GLOW,
    });
    rendererRef.current = renderer;
    renderer.start();

    const onResize = () => renderer.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [handleCometNearCenter]);

  // Demo boot-state timeline (skip bypasses this entirely)
  useEffect(() => {
    if (skip) {
      onComplete?.();
      return;
    }

    const timers: number[] = DEMO_STEPS.map((step) =>
      window.setTimeout(() => {
        setBootState(step.state);
        setStatusLabel(step.label);
      }, step.atMs),
    );

    const settleTimer = window.setTimeout(() => setPhase("settled"), 950);

    const exitTimer = window.setTimeout(() => {
      setPhase("exiting");
      window.setTimeout(() => {
        setPhase("done");
        onComplete?.();
      }, EXIT_TRANSITION_MS);
    }, EXIT_DELAY_MS);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(settleTimer);
      clearTimeout(exitTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  // Allow keyboard skip (Enter/Escape) once the mark has settled, matching
  // the "short launch path" requirement without adding a visible control.
  useEffect(() => {
    if (skip) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === "Enter" || e.key === "Escape") && phase !== "done") {
        setPhase("exiting");
        window.setTimeout(() => {
          setPhase("done");
          onComplete?.();
        }, EXIT_TRANSITION_MS);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, onComplete, skip]);

  if (phase === "done") return null;

  return (
    <div
      ref={rootRef}
      className={`stivium-boot-root phase-${phase}${isReady ? " is-ready" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Stivium — ${statusLabel}`}
    >
      {/* CSS-only "rain" background, adapted from Uiverse.io by SelfMadeSystem
          (shenanigans.shoghisimon.ca/collection/css-rain-bg) — the streak
          layer recolored into Stivium's sage/olive brand green instead of
          the original blue, and the hue-rotating dot-grid overlay tuned to
          near-invisible strength so it reads as a faint scanline shimmer
          behind the star field rather than a competing rainbow effect. */}
      {/* From Uiverse.io by kiranmayee-abbireddy — used exactly as authored,
          just placed inside a full-bleed absolute wrapper so it fills the
          boot screen instead of sitting at its own natural size. */}
      <div className="stivium-boot-sky-wrap" aria-hidden="true">
        <div className="uiverse-midnight-sky">
          <div className="sky-canvas">
            <div className="stars stars-1"></div>
            <div className="stars stars-2"></div>
            <div className="stars stars-3"></div>

            <div className="meteor m1"></div>
            <div className="meteor m2"></div>
            <div className="meteor m3"></div>

            <div className="moon"></div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="stivium-boot-canvas" />

      {/* Two large, very low-opacity blurred fields drifting behind the
          mark — the ambient-glow read-through of the blurred, blended
          "loader balls" reference, redone here as static/CSS-only so it
          never competes with the mark or the star field for attention. */}
      <div
        className="stivium-boot-aura stivium-boot-aura-a"
        aria-hidden="true"
      />
      <div
        className="stivium-boot-aura stivium-boot-aura-b"
        aria-hidden="true"
      />

      <div className="stivium-boot-composition">
        <div
          ref={logoElRef}
          className="stivium-boot-logo-wrap"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 150 150"
            className="stivium-boot-logo-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {BOOT_LOGO_FACETS.map((facet, i) => (
              <g
                key={facet.id}
                className="sbl-facet"
                style={{ ["--sbl-i" as string]: i }}
              >
                <path d={facet.d} fill={facet.fill} />
              </g>
            ))}
          </svg>
        </div>

        <h1 className="stivium-boot-wordmark">STIVIUM</h1>

        <div className="stivium-boot-progress" aria-hidden="true">
          <div
            className={`stivium-boot-progress-fill${isReady ? " is-complete" : " is-indeterminate"}`}
          />
        </div>
      </div>

      <p className="stivium-boot-credit" aria-hidden="true">
        Made with ❤️ by Aditya Bhatnagar!
      </p>
    </div>
  );
}
