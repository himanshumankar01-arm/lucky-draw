// Game constants and small helpers shared by the components.

export const TAU = Math.PI * 2;
export const N = 12; // numbers on the wheel
export const SEG = TAU / N; // angle of one slice
export const PAY = 10; // a win pays this many times the stake
export const START = 1000; // starting chips
export const MIN_BET = 10;
export const CHIPS = [10, 50, 100, 500];
export const COLORS = ['#b8322f', '#1d7f62'];
export const STORAGE_KEY = 'lucky-twelve-react-v1';

export const colorOf = (num) => COLORS[(num - 1) % 2];
export const fmt = (n) => Number(n).toLocaleString('en-US');

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Unbiased random integer in [0, n) from the browser's secure generator.
export function rndInt(n) {
  const a = new Uint32Array(1);
  const limit = Math.floor(4294967296 / n) * n;
  do {
    crypto.getRandomValues(a);
  } while (a[0] >= limit);
  return a[0] % n;
}

// Random float in [0, 1).
export function rndFloat() {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] / 4294967296;
}

export function loadSaved() {
  const fresh = { balance: START, spins: 0, wins: 0, hist: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const d = JSON.parse(raw);
    return {
      balance: Number.isFinite(d.balance) && d.balance >= 0 ? Math.floor(d.balance) : START,
      spins: Number.isFinite(d.spins) ? d.spins : 0,
      wins: Number.isFinite(d.wins) ? d.wins : 0,
      hist: Array.isArray(d.hist)
        ? d.hist.filter((h) => h && h.n >= 1 && h.n <= N).slice(0, 12)
        : [],
    };
  } catch {
    return fresh;
  }
}

export function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable: the game still works without saving */
  }
}
