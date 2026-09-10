export const CUTEBOT_CSS = `
.cb-root {
  --cb-size: 48px;
  --cb-bg: #111113;
  --cb-face: #ffffff;
  --cb-eye: #111113;
  --cb-accent: #ff5252;
  --cb-notify: #6c7bff;
  width: var(--cb-size);
  height: var(--cb-size);
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 28%;
  background: var(--cb-bg);
  cursor: pointer;
  user-select: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.25);
}

.cb-wobble {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: cb-idle-wobble 3.2s ease-in-out infinite;
  transform-origin: 50% 65%;
}

.cb-root:not(.cb-state-idle) .cb-wobble {
  animation-play-state: paused;
}

.cb-face {
  width: 72%;
  height: 72%;
  border-radius: 50%;
  background: var(--cb-face);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--cb-size) * 0.09);
}

.cb-eye {
  width: calc(var(--cb-size) * 0.11);
  height: calc(var(--cb-size) * 0.16);
  border-radius: 50%;
  background: var(--cb-eye);
  transform: translate(0px, 0px) scaleY(1);
}

.cb-mouth {
  position: absolute;
  bottom: 28%;
  width: calc(var(--cb-size) * 0.14);
  height: calc(var(--cb-size) * 0.05);
  border-radius: 0 0 60% 60%;
  background: var(--cb-eye);
  opacity: 0;
  transform-origin: top center;
}

.cb-state-speaking .cb-mouth {
  opacity: 1;
  animation: cb-talk 0.32s ease-in-out infinite alternate;
}

.cb-dots {
  position: absolute;
  right: -10%;
  bottom: 6%;
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.cb-state-active .cb-dots {
  opacity: 1;
}

.cb-dots span {
  width: calc(var(--cb-size) * 0.07);
  height: calc(var(--cb-size) * 0.07);
  border-radius: 50%;
  background: var(--cb-face);
  animation: cb-dot-bounce 1.1s ease-in-out infinite;
}
.cb-dots span:nth-child(2) { animation-delay: 0.15s; }
.cb-dots span:nth-child(3) { animation-delay: 0.3s; }

.cb-badge {
  position: absolute;
  top: -6%;
  right: -6%;
  width: 22%;
  height: 22%;
  border-radius: 50%;
  background: var(--cb-notify);
  border: 2px solid var(--cb-bg);
  opacity: 0;
  transform: scale(0);
}

.cb-state-notification .cb-badge {
  opacity: 1;
  animation: cb-badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.cb-spark {
  position: absolute;
  width: calc(var(--cb-size) * 0.14);
  height: calc(var(--cb-size) * 0.04);
  border-radius: 3px;
  background: var(--cb-accent);
  opacity: 0;
}
.cb-spark-1 { top: -8%; right: 6%; --r: 25deg; }
.cb-spark-2 { top: -2%; right: -10%; --r: -20deg; }

.cb-state-error .cb-spark-1,
.cb-state-error .cb-spark-2 {
  opacity: 1;
  transform: rotate(var(--r));
  animation: cb-spark-twinkle 0.5s ease-in-out infinite;
}

.cb-state-success .cb-spark-1,
.cb-state-success .cb-spark-2 {
  opacity: 1;
  background: #ffd23f;
  border-radius: 50%;
  width: calc(var(--cb-size) * 0.08);
  height: calc(var(--cb-size) * 0.08);
  transform: rotate(var(--r));
  animation: cb-spark-twinkle 0.6s ease-in-out infinite;
}

.cb-state-hover .cb-root,
.cb-root.cb-state-hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 6px 16px rgba(0,0,0,0.28), 0 0 14px rgba(255,255,255,0.35);
}

.cb-state-error .cb-wobble {
  animation: cb-shake 0.42s ease-in-out;
}

.cb-state-success .cb-wobble {
  animation: cb-bounce 0.5s ease;
}

.cb-state-active .cb-face {
  animation: cb-think-pulse 1.1s ease-in-out infinite;
}

@keyframes cb-idle-wobble {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg); }
}

@keyframes cb-shake {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  20% { transform: translateX(-5px) rotate(-6deg); }
  40% { transform: translateX(5px) rotate(6deg); }
  60% { transform: translateX(-4px) rotate(-4deg); }
  80% { transform: translateX(4px) rotate(4deg); }
}

@keyframes cb-bounce {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-8px) scale(1.08); }
  55% { transform: translateY(0) scale(0.95); }
  75% { transform: translateY(-3px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes cb-talk {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1); }
}

@keyframes cb-dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-3px); opacity: 1; }
}

@keyframes cb-badge-pop {
  0% { opacity: 0; transform: scale(0); }
  60% { opacity: 1; transform: scale(1.3); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes cb-spark-twinkle {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
}

@keyframes cb-think-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.94); }
}
`;
