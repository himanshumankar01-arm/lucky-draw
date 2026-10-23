import { useCallback, useRef, useState } from 'react';

// Small Web Audio helper. Sounds start only after the first user click.
export function useSound() {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);
  const ctxRef = useRef(null);
  const lastTick = useRef(0);

  const unlock = useCallback(() => {
    if (!enabledRef.current) return;
    if (!ctxRef.current) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        ctxRef.current = new Ctx();
      } catch {
        ctxRef.current = null;
      }
    }
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
  }, []);

  const beep = useCallback((freq, dur, type = 'sine', vol = 0.06, delay = 0) => {
    const ac = ctxRef.current;
    if (!enabledRef.current || !ac) return;
    try {
      const t = ac.currentTime + delay;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      /* ignore audio errors */
    }
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    if (next) unlock();
  }, [unlock]);

  const tick = useCallback(() => {
    const now = performance.now();
    if (now - lastTick.current < 38) return;
    lastTick.current = now;
    beep(1500, 0.025, 'square', 0.022);
  }, [beep]);

  const select = useCallback(() => beep(880, 0.05, 'triangle', 0.04), [beep]);
  const chip = useCallback(() => beep(660, 0.05, 'triangle', 0.04), [beep]);

  const win = useCallback(() => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => beep(f, 0.28, 'triangle', 0.07, i * 0.1));
  }, [beep]);

  const lose = useCallback(() => {
    beep(220, 0.3, 'sawtooth', 0.04, 0);
    beep(165, 0.45, 'sawtooth', 0.04, 0.18);
  }, [beep]);

  return { enabled, toggle, unlock, tick, select, chip, win, lose };
}
