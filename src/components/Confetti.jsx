import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { TAU } from '../game.js';

const COLORS = ['#e2b24f', '#f4ecd6', '#b8322f', '#1d7f62', '#ffd873'];

/** Full-screen confetti layer. Call ref.burst({ x, y }) to fire it. */
const Confetti = forwardRef(function Confetti(_props, ref) {
  const canvasRef = useRef(null);
  const parts = useRef([]);
  const running = useRef(false);
  const loopRef = useRef(null);

  useImperativeHandle(ref, () => ({
    burst({ x, y }) {
      for (let k = 0; k < 160; k++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        const sp = 380 + Math.random() * 620;
        parts.current.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          rot: Math.random() * TAU,
          vr: (Math.random() - 0.5) * 14,
          w: 6 + Math.random() * 7,
          h: 3 + Math.random() * 5,
          col: COLORS[k % COLORS.length],
          life: 0,
        });
      }
      if (!running.current && loopRef.current) {
        running.current = true;
        requestAnimationFrame(loopRef.current);
      }
    },
  }));

  useEffect(() => {
    const cv = canvasRef.current;
    const ctx = cv.getContext('2d');
    let dpr = 1;
    let last = performance.now();
    let alive = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = (now) => {
      if (!alive) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const H = window.innerHeight;
      parts.current = parts.current.filter((p) => p.y < H + 30 && p.life < 4.5);
      for (const p of parts.current) {
        p.life += dt;
        p.vy += 900 * dt;
        p.vx *= Math.pow(0.35, dt);
        p.vy *= Math.pow(0.6, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, Math.min(1, (4.5 - p.life) / 1.2));
        ctx.fillStyle = p.col;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (parts.current.length) {
        requestAnimationFrame(loop);
      } else {
        running.current = false;
      }
    };
    loopRef.current = loop;

    return () => {
      alive = false;
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fx" aria-hidden="true" />;
});

export default Confetti;
