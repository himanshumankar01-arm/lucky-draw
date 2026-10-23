import { CHIPS, MIN_BET, N, PAY, colorOf, fmt } from '../game.js';

const NUMBERS = Array.from({ length: N }, (_, i) => i + 1);

export default function BettingSlip({
  balance,
  bet,
  pick,
  spinning,
  result,
  hist,
  spins,
  wins,
  soundOn,
  onPick,
  onBet,
  onSpin,
  onRefill,
  onReset,
  onToggleSound,
}) {
  const broke = balance < MIN_BET && !spinning;

  // With no result yet (or after a change), show the ready message.
  const r = result || {
    state: 'idle',
    ball: '?',
    title: 'Ready to spin',
    desc: `Your number is ${pick}. Stake ${fmt(bet)} to win ${fmt(bet * PAY)}.`,
    color: undefined,
  };

  return (
    <section className="slip" aria-label="Betting slip">
      <div className="slip-top">
        <div>
          <div className="label">Betting slip</div>
          <div className="slip-title">Place your bid</div>
        </div>
        <div className="bal">
          <div className="label">Chips</div>
          <div className="bal-num">{fmt(balance)}</div>
        </div>
      </div>

      <div className="slip-body">
        <div className="field">
          <div className="field-head">
            <span className="label">Your number</span>
            <span className="val">{pick}</span>
          </div>
          <div className="nums">
            {NUMBERS.map((n) => (
              <button
                key={n}
                type="button"
                className="num"
                style={{ '--c': colorOf(n) }}
                aria-label={`Number ${n}`}
                aria-pressed={n === pick}
                disabled={spinning}
                onClick={() => onPick(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-head">
            <span className="label">Stake</span>
            <span className="val">{fmt(bet)} chips</span>
          </div>
          <div className="chips">
            {CHIPS.map((v) => (
              <button
                key={v}
                type="button"
                className="chip"
                data-v={v}
                aria-label={`Stake ${v} chips`}
                aria-pressed={v === bet}
                disabled={spinning || v > balance}
                onClick={() => onBet(v)}
              >
                <span>{v}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="sum">
          <div className="gain">
            <span className="label">If it lands</span>
            <span className="n">+{fmt(bet * PAY)}</span>
          </div>
          <div className="loss">
            <span className="label">If it misses</span>
            <span className="n">&minus;{fmt(bet)}</span>
          </div>
        </div>

        {broke ? (
          <button type="button" className="refill" onClick={onRefill}>
            Out of chips. Take 1,000 more
          </button>
        ) : (
          <button type="button" className="spin" disabled={spinning} onClick={onSpin}>
            {spinning ? 'Spinning…' : 'Spin the wheel'}
          </button>
        )}

        <div className="result" data-state={r.state} aria-live="polite">
          <div className="ball" style={r.color ? { background: r.color } : undefined}>
            {r.ball}
          </div>
          <div className="rtext">
            <div className="rtitle">{r.title}</div>
            <div className="rdesc">{r.desc}</div>
          </div>
        </div>

        <div className="field">
          <div className="field-head">
            <span className="label">Recent spins</span>
          </div>
          <div className="history">
            {hist.length === 0 ? (
              <span className="empty">No spins yet.</span>
            ) : (
              hist.map((h, i) => (
                <span
                  key={i}
                  className={`dot${h.hit ? ' hit' : ''}`}
                  style={{ '--c': colorOf(h.n) }}
                  title={h.hit ? `Won on ${h.n}` : `Landed on ${h.n}`}
                >
                  {h.n}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="foot">
          <div className="stats">
            Spins {spins} · Wins {wins}
          </div>
          <div className="tools">
            <button type="button" className="tool" aria-pressed={soundOn} onClick={onToggleSound}>
              {soundOn ? 'Sound on' : 'Sound off'}
            </button>
            <button type="button" className="tool" disabled={spinning} onClick={onReset}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
