type TitleBarStarfieldProps = {
  /** Kept so the existing call site in TitleBar keeps compiling. */
  isPaused?: boolean;
};

/** Intentionally renders nothing. Linear's chrome is flat: DESIGN.md §6
 * forbids "bright ambient glow" and §7 forbids "decorative noise", so the
 * titlebar is just `--color-bg` plus a hairline border (set in TitleBar). */
export function TitleBarStarfield(
  _props: TitleBarStarfieldProps,
): JSX.Element | null {
  return null;
}
