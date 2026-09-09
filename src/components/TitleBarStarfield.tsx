type TitleBarStarfieldProps = {
  /** True when the OS window has lost focus — freezes the decorative
   * glow animation instead of burning compositor cycles on a strip
   * nobody is looking at. */
  isPaused?: boolean;
};

/** A single restrained, low-cost ambient glow behind the titlebar
 * content — two static radial highlights (defined in `.stv-titlebar-fx`,
 * interactions.css) with one `opacity` breathing animation. Replaces the
 * previous twinkling starfield + shooting-star effect, which read as
 * playful chrome decoration rather than the reference's clean,
 * precision-engineering titlebar. */
export function TitleBarStarfield({
  isPaused = false,
}: TitleBarStarfieldProps): JSX.Element {
  return (
    <div
      className={`stv-titlebar-fx${isPaused ? " stv-titlebar-fx--paused" : ""}`}
      aria-hidden="true"
    >
      <div className="stv-titlebar-vignette" />
    </div>
  );
}
