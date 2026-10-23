import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { COLORS, N, SEG, TAU, prefersReducedMotion } from '../game.js';

const easeOut4 = (p) => 1 - Math.pow(1 - p, 4);
const easeOut3 = (p) => 1 - Math.pow(1 - p, 3);

/**
 * Canvas wheel. Animation state lives in refs so React does not re-render
 * on every frame. The parent controls it through the ref:
 *   alignTo(number)                 turn the wheel so that number sits under the pointer
 *   spinTo(index, offset, onDone)   spin and stop on slice `index` (0-based)
 *   getCenter()                     screen position of the wheel (for confetti)
 */
const Wheel = forwardRef(function Wheel({ pick, hub, spinning, resultIdx, onTick }, ref) {
  const canvasRef = useRef(null);
  const props = useRef({ pick, hub, spinning, resultIdx, onTick });
  props.current = { pick, hub, spinning, resultIdx, onTick };

  const state = useRef({
    theta: -(pick - 1) * SEG,
    anim: null,
    deflect: 0,
    lastIdx: 0,
    dpr: 1,
  });

  useImperativeHandle(ref, () => ({
    alignTo(num) {
      const s = state.current;
      const target = -(num - 1) * SEG;
      const delta = ((((target - s.theta) % TAU) + TAU * 1.5) % TAU) - Math.PI;
      s.lastIdx = Math.floor(s.theta / SEG + 0.5);
      s.anim = {
        from: s.theta,
        to: s.theta + delta,
        t0: performance.now(),
        dur: prefersReducedMotion() ? 1 : 520,
        ease: easeOut3,
        ticks: false,
        done: null,
      };
    },
    spinTo(index, offset, onDone) {
      const s = state.current;
      const targetMod = -(index * SEG + offset * SEG);
      const mod = (((targetMod - s.theta) % TAU) + TAU) % TAU;
      const extraTurns = 5 + Math.floor(Math.random() * 3);
      s.lastIdx = Math.floor(s.theta / SEG + 0.5);
      s.anim = {
        from: s.theta,
        to: s.theta + extraTurns * TAU + mod,
        t0: performance.now(),
        dur: prefersReducedMotion() ? 1800 : 6400,
        ease: easeOut4,
        ticks: true,
        done: () => {
          // Read the winner from the wheel's final angle.
          const landed = ((Math.round(-s.theta / SEG) % N) + N) % N;
          onDone(landed);
        },
      };
    },
    getCenter() {
      const r = canvasRef.current.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.45 };
    },
  }));

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    const s = state.current;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      s.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(cv.clientWidth * s.dpr);
      cv.height = Math.round(cv.clientHeight * s.dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv.parentElement);
    resize();

    if (document.fonts) {
      document.fonts.load('20px "Rozha One"').catch(() => {});
    }

    const draw = (now) => {
      const { pick: pk, hub: hubText, spinning: isSpinning, resultIdx: resIdx } = props.current;
      const size = cv.clientWidth;
      if (!size) return;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      const c = size / 2;
      const R = size * 0.47;
      const Rs = R * 0.88;
      const theta = s.theta;

      // brass rim
      const rim = ctx.createLinearGradient(c - R, c - R, c + R, c + R);
      rim.addColorStop(0, '#f7dc92');
      rim.addColorStop(0.35, '#c9993a');
      rim.addColorStop(0.6, '#f0c96a');
      rim.addColorStop(1, '#7c5a18');
      ctx.beginPath();
      ctx.arc(c, c, R, 0, TAU);
      ctx.fillStyle = rim;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c, c, R * 0.925, 0, TAU);
      ctx.fillStyle = '#0a1210';
      ctx.fill();

      // chasing bulbs
      const phase = Math.floor(now / (isSpinning ? 90 : 520)) % 2;
      const bulbs = 24;
      for (let b = 0; b < bulbs; b++) {
        const ba = -Math.PI / 2 + (b / bulbs) * TAU;
        const bx = c + Math.cos(ba) * R * 0.962;
        const by = c + Math.sin(ba) * R * 0.962;
        const lit = b % 2 === phase;
        ctx.beginPath();
        ctx.arc(bx, by, size * 0.0115, 0, TAU);
        if (lit) {
          ctx.fillStyle = '#fff4c8';
          ctx.shadowColor = '#ffd873';
          ctx.shadowBlur = size * 0.022;
        } else {
          ctx.fillStyle = '#80601d';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // slices
      for (let i = 0; i < N; i++) {
        const a0 = -Math.PI / 2 + (i - 0.5) * SEG + theta;
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.arc(c, c, Rs, a0, a0 + SEG);
        ctx.closePath();
        ctx.fillStyle = COLORS[i % 2];
        ctx.fill();
      }
      const shade = ctx.createRadialGradient(c, c, Rs * 0.1, c, c, Rs);
      shade.addColorStop(0, 'rgba(0,0,0,0.38)');
      shade.addColorStop(0.55, 'rgba(0,0,0,0)');
      shade.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.beginPath();
      ctx.arc(c, c, Rs, 0, TAU);
      ctx.fillStyle = shade;
      ctx.fill();

      // dividers
      ctx.strokeStyle = 'rgba(244,236,214,0.55)';
      ctx.lineWidth = Math.max(1, size * 0.003);
      for (let i = 0; i < N; i++) {
        const da = -Math.PI / 2 + (i - 0.5) * SEG + theta;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(da) * R * 0.2, c + Math.sin(da) * R * 0.2);
        ctx.lineTo(c + Math.cos(da) * Rs, c + Math.sin(da) * Rs);
        ctx.stroke();
      }

      // highlight the picked slice
      const pi = pk - 1;
      const pa0 = -Math.PI / 2 + (pi - 0.5) * SEG + theta;
      const pa1 = pa0 + SEG;
      const pulse = 0.5 + 0.5 * Math.sin(now / 220);
      const won = resIdx === pi && !isSpinning;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, Rs, pa0, pa1);
      ctx.closePath();
      ctx.fillStyle = won ? `rgba(255,236,170,${0.2 + 0.25 * pulse})` : 'rgba(255,255,255,0.14)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c, c, Rs - size * 0.006, pa0 + 0.01, pa1 - 0.01);
      ctx.strokeStyle = '#ffd873';
      ctx.lineWidth = size * 0.012;
      ctx.lineCap = 'round';
      if (won) {
        ctx.shadowColor = '#ffd873';
        ctx.shadowBlur = size * 0.04 * pulse + 4;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // numbers
      ctx.fillStyle = '#f4ecd6';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `400 ${size * 0.066}px "Rozha One", Georgia, serif`;
      for (let i = 0; i < N; i++) {
        const ca = -Math.PI / 2 + i * SEG + theta;
        ctx.save();
        ctx.translate(c, c);
        ctx.rotate(ca);
        ctx.translate(Rs * 0.76, 0);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(String(i + 1), 0, 0);
        ctx.restore();
      }

      // inner ring
      ctx.beginPath();
      ctx.arc(c, c, Rs, 0, TAU);
      ctx.strokeStyle = '#d9a940';
      ctx.lineWidth = size * 0.01;
      ctx.stroke();

      // hub
      const hg = ctx.createLinearGradient(c - R * 0.22, c - R * 0.22, c + R * 0.22, c + R * 0.22);
      hg.addColorStop(0, '#f7dc92');
      hg.addColorStop(0.5, '#b98a2e');
      hg.addColorStop(1, '#f0c96a');
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = size * 0.02;
      ctx.shadowOffsetY = size * 0.008;
      ctx.beginPath();
      ctx.arc(c, c, R * 0.2, 0, TAU);
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(c, c, R * 0.155, 0, TAU);
      ctx.fillStyle = '#0c1716';
      ctx.fill();
      ctx.fillStyle = '#f4ecd6';
      ctx.font = `400 ${size * 0.085}px "Rozha One", Georgia, serif`;
      ctx.fillText(hubText, c, c + size * 0.004);

      // pointer
      const ph = R * 0.19;
      const pw = R * 0.075;
      ctx.save();
      ctx.translate(c, c - R * 0.99);
      ctx.rotate(-s.deflect);
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = size * 0.012;
      ctx.shadowOffsetY = size * 0.006;
      ctx.beginPath();
      ctx.moveTo(-pw, 0);
      ctx.lineTo(pw, 0);
      ctx.lineTo(0, ph);
      ctx.closePath();
      const pg = ctx.createLinearGradient(-pw, 0, pw, 0);
      pg.addColorStop(0, '#fff1c2');
      pg.addColorStop(1, '#c4922f');
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.beginPath();
      ctx.arc(0, 0, pw * 0.7, 0, TAU);
      ctx.fillStyle = '#7c5a18';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, pw * 0.3, 0, TAU);
      ctx.fillStyle = '#fff1c2';
      ctx.fill();
      ctx.restore();
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = s.anim;
      if (a) {
        const p = Math.min(1, (now - a.t0) / a.dur);
        s.theta = a.from + (a.to - a.from) * a.ease(p);
        const idx = Math.floor(s.theta / SEG + 0.5);
        if (a.ticks && idx !== s.lastIdx) {
          s.deflect = 0.5;
          if (props.current.onTick) props.current.onTick();
        }
        s.lastIdx = idx;
        if (p >= 1) {
          s.anim = null;
          if (a.done) a.done();
        }
      }
      s.deflect *= Math.exp(-dt * 12);
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="wheel" role="img" aria-label="Wheel with numbers 1 to 12" />;
});

export default Wheel;
