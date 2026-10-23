import { useEffect, useRef, useState } from 'react';
import Wheel from './components/Wheel.jsx';
import BettingSlip from './components/BettingSlip.jsx';
import Confetti from './components/Confetti.jsx';
import { useSound } from './hooks/useSound.js';
import {
  CHIPS,
  MIN_BET,
  N,
  PAY,
  START,
  colorOf,
  fmt,
  loadSaved,
  prefersReducedMotion,
  rndFloat,
  rndInt,
  save,
} from './game.js';

export default function App() {
  const [saved] = useState(loadSaved);
  const [balance, setBalance] = useState(saved.balance);
  const [spins, setSpins] = useState(saved.spins);
  const [wins, setWins] = useState(saved.wins);
  const [hist, setHist] = useState(saved.hist);

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState(7);
  const [hub, setHub] = useState('7');
  const [spinning, setSpinning] = useState(false);
  const [resultIdx, setResultIdx] = useState(-1);
  const [result, setResult] = useState(null); // null means "ready to spin"

  const wheel = useRef(null);
  const confetti = useRef(null);
  const sound = useSound();

  // Save progress whenever it changes.
  useEffect(() => {
    save({ balance, spins, wins, hist });
  }, [balance, spins, wins, hist]);

  // Keep the stake affordable.
  useEffect(() => {
    if (spinning || bet <= balance) return;
    const ok = CHIPS.filter((v) => v <= balance);
    setBet(ok.length ? ok[ok.length - 1] : CHIPS[0]);
  }, [balance, bet, spinning]);

  const handlePick = (n) => {
    if (spinning) return;
    sound.unlock();
    sound.select();
    setPick(n);
    setHub(String(n));
    setResultIdx(-1);
    setResult(null);
    wheel.current.alignTo(n);
  };

  const handleBet = (v) => {
    if (spinning || v > balance) return;
    sound.unlock();
    sound.chip();
    setBet(v);
    setResult(null);
  };

  const handleSpin = () => {
    if (spinning || bet > balance || bet < MIN_BET) return;
    sound.unlock();

    // Lock in the round: these values cannot change while the wheel spins.
    const stake = bet;
    const chosen = pick;
    const winner = rndInt(N);
    const offset = (rndFloat() - 0.5) * 0.7; // where inside the slice it stops

    setSpinning(true);
    setResultIdx(-1);
    setBalance((b) => b - stake);
    setHub('…');
    setResult({
      state: 'spinning',
      ball: '…',
      title: 'Spinning',
      desc: `Watching for number ${chosen}.`,
      color: colorOf(chosen),
    });

    wheel.current.spinTo(winner, offset, (landed) => finish(landed, stake, chosen));
  };

  const finish = (idx, stake, chosen) => {
    const num = idx + 1;
    const hit = num === chosen;

    setSpinning(false);
    setSpins((s) => s + 1);
    setResultIdx(idx);
    setHub(String(num));
    setHist((h) => [{ n: num, hit }, ...h].slice(0, 12));

    if (hit) {
      setWins((w) => w + 1);
      setBalance((b) => b + stake * (PAY + 1));
      setResult({
        state: 'win',
        ball: num,
        title: 'You win',
        desc: `It stopped on ${num}, your number. +${fmt(stake * PAY)} chips.`,
        color: colorOf(num),
      });
      sound.win();
      if (!prefersReducedMotion()) confetti.current?.burst(wheel.current.getCenter());
    } else {
      setResult({
        state: 'lose',
        ball: num,
        title: 'Not this time',
        desc: `It stopped on ${num}. You picked ${chosen}. −${fmt(stake)} chips.`,
        color: colorOf(num),
      });
      sound.lose();
    }
  };

  const handleRefill = () => {
    setBalance((b) => b + START);
    setResult(null);
  };

  const handleReset = () => {
    if (spinning) return;
    setBalance(START);
    setSpins(0);
    setWins(0);
    setHist([]);
    setBet(50);
    setResultIdx(-1);
    setResult(null);
  };

  return (
    <>
      <div className="shell">
        <header>
  
          <h1>
            LUCKY <span>DRAW</span>
          </h1>
          <p className="lede">
            Pick a number and set your stake. Spin the wheel. If it stops on your number, you win. Any other
            number and the stake is gone.
          </p>
        </header>

        <div className="layout">
          <section className="stage-wrap" aria-label="Wheel">
            <div className="stage">
              <Wheel
                ref={wheel}
                pick={pick}
                hub={hub}
                spinning={spinning}
                resultIdx={resultIdx}
                onTick={sound.tick}
              />
            </div>
            <div className="odds">
              Chance on your number: <b>1 in {N}</b> ({(100 / N).toFixed(1)}%) &nbsp;·&nbsp; Win pays{' '}
              <b>{PAY} to 1</b>
            </div>
          </section>

          <BettingSlip
            balance={balance}
            bet={bet}
            pick={pick}
            spinning={spinning}
            result={result}
            hist={hist}
            spins={spins}
            wins={wins}
            soundOn={sound.enabled}
            onPick={handlePick}
            onBet={handleBet}
            onSpin={handleSpin}
            onRefill={handleRefill}
            onReset={handleReset}
            onToggleSound={sound.toggle}
          />
        </div>
      </div>
      <Confetti ref={confetti} />
    </>
  );
}
