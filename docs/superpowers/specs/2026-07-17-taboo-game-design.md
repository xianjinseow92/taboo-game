# Taboo Party Game — Design Spec

Date: 2026-07-17
Status: Approved pending user review

## Purpose

A locally hosted website that acts as a party companion for playing Taboo in person: it replaces the physical card deck and provides the timer, scoring, and scoreboard. One shared device (phone or laptop) is passed around; the clue-giver holds it, the opposing team watches for taboo violations.

## Game rules

- One clue-giver per turn sees a card: a target word plus exactly 5 forbidden (taboo) words. Teammates guess the target word before the timer runs out; the clue-giver may not say the target or any taboo word.
- Scoring (classic): **+1** per correct guess, **−1** when buzzed for saying a taboo word, **skips are free and unlimited**. Scores can go negative.
- Turn order: teams rotate in setup order. A "round" = every team has taken exactly one turn.
- Timer: configurable per game — 30 / 60 / 90 / 120 seconds (default 60).
- Card open when timer expires: discarded, counts as neither correct nor skipped (recap shows it as "time up").
- Deck exhaustion mid-game: automatically reshuffle all used cards and continue, with a "deck reshuffled" toast.
- Undo: one-level undo on the play screen reverts the last Correct/Taboo/Skip action (restores the card and score).
- Tie at game end: sudden death — tied teams each take one more turn until the tie breaks.

## Game modes (end conditions, chosen at setup)

1. **Fixed rounds** — configurable number of rounds; highest score after the last round wins.
2. **Race to target score** — configurable target; win is checked only at the end of a complete round so all teams get equal turns.
3. **Freeplay** — no end condition; a persistent "End game" control jumps to the winner screen whenever the party is done.

## Teams

- Any number of teams, minimum 2. Each team gets a name (editable) and an auto-assigned color.

## Card decks

- Four categories, each a local TypeScript data file with ~60 cards (~240 total):
  - **Classic everyday words** (umbrella, birthday, traffic jam…)
  - **Pop culture & entertainment** (movies, celebrities, songs, memes)
  - **Food & drink** — includes Singaporean/Asian staples (laksa, durian, kopi, hawker centre…)
  - **Tech & work life** (standup meeting, deadline, Wi-Fi, ChatGPT…)
- At setup, any combination of decks can be selected; selected decks are shuffled together into one draw pile.
- Card shape: `{ word: string, taboo: [string ×5], category: CategoryId }`. Decks are plain data files so cards are easy to add by hand later.

## Screens & flow

1. **Setup** — add/remove/rename teams, toggle deck categories (chips), timer length, game mode + its parameter (rounds count or target score). Start game.
2. **Get-ready** (between turns) — shows whose turn is next, current standings, big "Start turn" button. Safe for all players to see; prevents card flash before handoff.
3. **Play** — big Taboo-style card (target word in a colored header band, 5 taboo words below), countdown ring that turns red with ticking in the last 10 seconds, live turn tally, and three oversized buttons: **Correct (+1)**, **Taboo (−1)**, **Skip (free)**, plus Undo. Card transitions animate. Buzzer sound at zero.
4. **Turn recap** — list of that turn's cards grouped by outcome (correct / buzzed / skipped / time up), net turn score, updated standings; continue to next team's get-ready.
5. **Winner** — final scoreboard, confetti, "Play again" (same settings) and "New game" (back to setup).

## Architecture

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui components + Framer Motion (animations) + Web Audio API (synthesized tick/buzzer, no audio assets). No backend; pure client-side SPA.
- **State:** single game reducer (`useReducer` + context). Every game event (start turn, correct, buzz, skip, undo, end turn, …) is a reducer action; the rules engine is a pure function.
- **Persistence:** full game state auto-saved to localStorage after every action. On load, offer "Resume game" / "Start fresh". No mid-turn timer resume: an interrupted turn restarts from get-ready, keeping points already earned that turn.

### Structure

```
src/
  decks/            # classic.ts, pop-culture.ts, food-drink.ts, tech-work.ts, index.ts (types + registry)
  game/             # gameReducer.ts, types.ts, selectors.ts (pure logic)
  components/       # Setup, GetReady, Play, TurnRecap, Winner screens
  components/ui/    # shadcn/ui primitives
  hooks/            # useCountdown, useGamePersistence, useSounds
```

## Design language

Playful party aesthetic: dark background, vivid team colors, big rounded cards mimicking physical Taboo cards, oversized touch targets. Mobile-first responsive; also comfortable on a laptop.

## Future extensibility: remote sessions (not built now)

Remote play (people joining a session from their own devices) is a distant-future idea. Nothing is implemented for it now, but the architecture is shaped so it can be added without a rewrite:

- **All game mutations are serializable action objects** dispatched through the single pure reducer. This is exactly the shape needed to relay actions through a server later (event-sourced: same actions, same reducer, replicated state).
- **`src/game/` has zero React/DOM/browser dependencies** — pure TypeScript. The identical rules engine could run on a Node server or in every remote client.
- **The UI talks to a thin `GameStore` interface** (`getState()`, `dispatch(action)`, `subscribe(listener)`) rather than calling `useReducer` directly. Today the only implementation is local (in-memory + localStorage). A future `RemoteGameStore` implementing the same interface (WebSocket-backed) would drop in without touching screens.
- **State is fully serializable** (plain JSON: no functions, class instances, or Dates; teams referenced by generated IDs) — required for localStorage today, sufficient for network sync tomorrow.
- **Randomness is injectable**: shuffling uses a seeded RNG passed into the reducer via action payloads (the shuffled order travels in the action), so a future server can own the deck and clients stay deterministic.

## Error handling

- Corrupted or version-mismatched localStorage → fall back to a fresh start, never crash.
- Deck validation: every card has a word and exactly 5 taboo words, enforced by TypeScript types plus a dev-time runtime check.

## Testing

- Vitest unit tests on the game reducer: scoring arithmetic, team rotation, round completion, all three end conditions, equal-turns win check in race mode, tie → sudden death, deck reshuffle, undo, persistence snapshot round-trip.
- Screens verified manually in the browser during development.

## Hosting / running

- `npm run dev` (with `--host`) serves locally; playable on the Mac or any phone on the same Wi-Fi.

## Out of scope (YAGNI)

- No backend, accounts, or match history.
- No online/remote multiplayer.
- No AI guesser/clue-giver.
- No in-app deck editor (cards are edited in source files).
