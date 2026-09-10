import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { CuteBot } from "../lib/cuteBot";

type CuteBotIconProps = {
  isRunning: boolean;
  isAiActive: boolean;
  onClick?: () => void;
  /** bump this number whenever a run finishes with an error */
  errorSignal?: number;
  /** bump this number whenever a run finishes successfully */
  successSignal?: number;
};

export function CuteBotIcon({
  isRunning,
  isAiActive,
  onClick,
  errorSignal,
  successSignal,
}: CuteBotIconProps): JSX.Element {
  const slotRef = useRef<HTMLDivElement | null>(null);
  const botRef = useRef<CuteBot | null>(null);

  useEffect(() => {
    if (!slotRef.current) return;
    const bot = new CuteBot({
      container: slotRef.current,
      size: 30,
      colors: {
        background: "#060607",
        face: "#ffffff",
        eye: "#060607",
        accent: "#ff5252",
        notify: "#8b7bff", // swap for var(--color-accent) if you want it to match Run
      },
    });
    botRef.current = bot;
    return () => bot.destroy();
  }, []);

  useEffect(() => {
    if (isRunning) botRef.current?.think(4000);
  }, [isRunning]);

  useEffect(() => {
    if (isAiActive) botRef.current?.notify(1800);
  }, [isAiActive]);

  useEffect(() => {
    if (errorSignal) botRef.current?.flashError();
  }, [errorSignal]);

  useEffect(() => {
    if (successSignal) botRef.current?.flashSuccess();
  }, [successSignal]);

  return (
    <div
      ref={slotRef}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      title="Stivium AI"
      aria-label="AI assistant"
      aria-pressed={isAiActive}
      className="stv-wincontrol"
      style={
        {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          cursor: onClick ? "pointer" : "default",
          WebkitAppRegion: "no-drag",
        } as CSSProperties
      }
    />
  );
}
