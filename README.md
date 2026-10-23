# Lucky Twelve (React)

A wheel of fortune game. Pick a number from 1 to 12, set your stake and spin.
If the wheel stops on your number you win 10 to 1. Otherwise you lose the stake.

Built with React 18 and Vite. No other libraries.

## Run it

You need Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the address that Vite prints (usually http://localhost:5173).

## Build for a website

```bash
npm run build
```

The finished site is in the `dist` folder. Upload that folder to any static host
(Netlify, Vercel, GitHub Pages, your own server).

## Project layout

```
index.html                  page shell and font links
src/main.jsx                React entry point
src/App.jsx                 game state and rules (spin, win, lose, chips)
src/game.js                 constants (N, PAY, START...), random helpers, saving
src/styles.css              all styling
src/components/Wheel.jsx    canvas wheel and its spin animation
src/components/BettingSlip.jsx  number grid, chips, result, history
src/components/Confetti.jsx win celebration
src/hooks/useSound.js       tick, win and lose sounds (Web Audio)
```

## Change the game

Open `src/game.js`:

- `N` is how many numbers are on the wheel (12). The wheel and the number grid follow it.
- `PAY` is how many times your stake a win pays (10).
- `START` is the starting chips (1000).
- `CHIPS` are the stake buttons ([10, 50, 100, 500]).

The winning number is picked with the browser's secure random generator, so every
number has the same chance (1 in N). Chips and history are saved in the browser
(localStorage). The Reset button clears them.
