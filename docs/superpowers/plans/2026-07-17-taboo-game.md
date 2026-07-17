# Taboo Party Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A locally hosted Taboo party-companion website: card deck, turn timer, scoring, and scoreboard for in-person play on one shared device.

**Architecture:** Pure client-side SPA. All game rules live in a pure reducer under `src/game/` (no React or DOM imports) driven by serializable action objects; a thin `GameStore` interface (getState/dispatch/subscribe) wraps it with localStorage persistence, keeping the door open for a future remote (WebSocket) store. Screens are React components that render from store state.

**Tech Stack:** Vite + React + TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, canvas-confetti, Web Audio API, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-17-taboo-game-design.md`

## Global Constraints

- Repo root: `/Users/bytedance/Desktop/code-repos/taboo-game` (git repo exists, contains only `docs/`).
- Scoring: **+1** correct, **−1** buzzed, **skip free and unlimited**; scores may go negative.
- Timer options exactly `30 | 60 | 90 | 120` seconds, default 60.
- Three game modes selectable at setup: `rounds` (fixed rounds), `target` (race to score, win checked only at end of a complete round), `freeplay` (manual end).
- Any number of teams, minimum 2.
- Four decks (`classic`, `pop-culture`, `food-drink`, `tech-work`), **at least 60 cards each**, mixable at setup.
- `src/game/` and `src/decks/` are pure TypeScript: no React, no DOM imports, relative imports only (portable to a Node server later). Browser storage enters only via an injectable `StorageLike` parameter with a guarded default.
- All game state is plain JSON: no functions, class instances, or Date objects in state; teams referenced by generated string ids.
- Code comments: brief, use commas or colons, never em-dashes.
- Commit messages: conventional style, NO Co-Authored-By trailer.
- Tests run with `npm run test` (vitest, node environment, no jsdom needed).

---

### Task 1: Scaffold the project

**Files:**
- Create: Vite template files at repo root (`package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, tsconfigs, `.gitignore`)
- Create: `components.json`, `src/components/ui/*` (shadcn), `src/lib/utils.ts` (shadcn)

**Interfaces:**
- Produces: working `npm run dev` (with `--host`), `npm run test`, `@/` path alias, shadcn components `button card input badge dialog sonner`, deps `framer-motion`, `canvas-confetti`, `tailwindcss`, `vitest`.

- [ ] **Step 1: Scaffold Vite into the non-empty repo**

```bash
cd /Users/bytedance/Desktop/code-repos/taboo-game
npm create vite@latest scaffold -- --template react-ts
mv scaffold/.gitignore .
mv scaffold/* .
rmdir scaffold
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion canvas-confetti tailwindcss @tailwindcss/vite
npm install -D vitest @types/canvas-confetti @types/node
```

- [ ] **Step 3: Configure Vite, Tailwind, alias, scripts**

Replace `vite.config.ts`:

```ts
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

Replace the whole content of `src/index.css` with:

```css
@import "tailwindcss";
```

Add to `compilerOptions` in BOTH `tsconfig.json` and `tsconfig.app.json` (shadcn CLI requires it in both):

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

In `package.json` scripts set:

```json
"dev": "vite --host",
"test": "vitest run"
```

In `index.html`: set `<title>Taboo</title>` and `<html lang="en" class="dark">` (dark party theme).

- [ ] **Step 4: Initialize shadcn/ui and add components**

```bash
npx shadcn@latest init --base-color neutral --yes
npx shadcn@latest add button card input badge dialog sonner --yes
```

If `init` complains, follow its prompt defaults (style: default, CSS variables: yes). Verify `src/components/ui/button.tsx` exists afterwards.

- [ ] **Step 5: Replace template app with a placeholder**

Delete `src/App.css` and `src/assets/react.svg`. Replace `src/App.tsx`:

```tsx
export default function App() {
  return <h1 className="p-8 text-3xl font-bold">Taboo</h1>;
}
```

Remove the `import './App.css'` / logo references if any remain in `src/main.tsx` (keep `import './index.css'`).

- [ ] **Step 6: Verify dev server and test runner**

```bash
npx tsc -b && npx vitest run --passWithNoTests
```
Expected: typecheck clean, vitest reports "no test files found" and exits 0.

```bash
npm run dev
```
Expected: page at the printed URL shows a bold "Taboo" heading on a dark background (bold + dark proves Tailwind and the dark class work). Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite react-ts with tailwind v4, shadcn/ui, vitest"
```

---

### Task 2: Card types and shuffle utility

**Files:**
- Create: `src/decks/types.ts`
- Create: `src/game/shuffle.ts`
- Test: `src/game/shuffle.test.ts`

**Interfaces:**
- Produces: `CategoryId = 'classic' | 'pop-culture' | 'food-drink' | 'tech-work'`; `Card { word: string; taboo: [string, string, string, string, string]; category: CategoryId }`; `shuffle<T>(items: readonly T[], rng?: () => number): T[]` (Fisher-Yates, injectable rng, does not mutate input).

- [ ] **Step 1: Write the failing test**

`src/game/shuffle.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle';

describe('shuffle', () => {
  it('is deterministic with an injected rng', () => {
    // rng always 0 swaps each element to the front in turn
    expect(shuffle([1, 2, 3, 4, 5], () => 0)).toEqual([2, 3, 4, 5, 1]);
  });

  it('returns a new array with the same members', () => {
    const input = ['a', 'b', 'c'];
    const out = shuffle(input, () => 0.99);
    expect(out).not.toBe(input);
    expect([...out].sort()).toEqual(['a', 'b', 'c']);
    expect(input).toEqual(['a', 'b', 'c']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/shuffle.test.ts`
Expected: FAIL, cannot resolve `./shuffle`.

- [ ] **Step 3: Implement**

`src/decks/types.ts`:

```ts
export type CategoryId = 'classic' | 'pop-culture' | 'food-drink' | 'tech-work';

export interface Card {
  word: string;
  taboo: [string, string, string, string, string];
  category: CategoryId;
}
```

`src/game/shuffle.ts`:

```ts
// Fisher-Yates with injectable rng: callers pass a seeded rng for determinism,
// the shuffled order always travels inside action payloads, never inside the reducer
export function shuffle<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/shuffle.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/decks/types.ts src/game/shuffle.ts src/game/shuffle.test.ts
git commit -m "feat: card types and deterministic shuffle utility"
```

---

### Task 3: Deck data (4 decks, 60+ cards each) and registry

**Files:**
- Create: `src/decks/classic.ts`, `src/decks/pop-culture.ts`, `src/decks/food-drink.ts`, `src/decks/tech-work.ts`
- Create: `src/decks/index.ts`
- Test: `src/decks/decks.test.ts`

**Interfaces:**
- Consumes: `Card`, `CategoryId` from `src/decks/types.ts`.
- Produces: `Deck { id: CategoryId; label: string; cards: Card[] }`; `DECKS: Record<CategoryId, Deck>`; `buildDrawPile(deckIds: CategoryId[]): Card[]`.

- [ ] **Step 1: Write the failing validation test**

`src/decks/decks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DECKS, buildDrawPile } from './index';

const entries = Object.values(DECKS);

describe('deck registry', () => {
  it('exposes all four decks', () => {
    expect(entries.map((d) => d.id).sort()).toEqual(
      ['classic', 'food-drink', 'pop-culture', 'tech-work'],
    );
  });

  it('buildDrawPile concatenates selected decks', () => {
    const pile = buildDrawPile(['classic', 'food-drink']);
    expect(pile.length).toBe(DECKS.classic.cards.length + DECKS['food-drink'].cards.length);
  });
});

describe.each(entries.map((d) => [d.id, d] as const))('deck %s', (_id, deck) => {
  it('has at least 60 valid cards', () => {
    expect(deck.cards.length).toBeGreaterThanOrEqual(60);
    const words = new Set<string>();
    for (const card of deck.cards) {
      const lower = card.word.trim().toLowerCase();
      expect(lower.length).toBeGreaterThan(0);
      expect(words.has(lower)).toBe(false);
      words.add(lower);
      expect(card.taboo).toHaveLength(5);
      for (const t of card.taboo) {
        expect(t.trim().length).toBeGreaterThan(0);
        expect(t.trim().toLowerCase()).not.toBe(lower);
      }
      expect(card.category).toBe(deck.id);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/decks/decks.test.ts`
Expected: FAIL, cannot resolve `./index`.

- [ ] **Step 3: Create the registry**

`src/decks/index.ts`:

```ts
import type { Card, CategoryId } from './types';
import { classic } from './classic';
import { popCulture } from './pop-culture';
import { foodDrink } from './food-drink';
import { techWork } from './tech-work';

export interface Deck {
  id: CategoryId;
  label: string;
  cards: Card[];
}

export const DECKS: Record<CategoryId, Deck> = {
  classic: { id: 'classic', label: 'Classic', cards: classic },
  'pop-culture': { id: 'pop-culture', label: 'Pop Culture', cards: popCulture },
  'food-drink': { id: 'food-drink', label: 'Food & Drink', cards: foodDrink },
  'tech-work': { id: 'tech-work', label: 'Tech & Work', cards: techWork },
};

export function buildDrawPile(deckIds: CategoryId[]): Card[] {
  return deckIds.flatMap((id) => DECKS[id].cards);
}
```

- [ ] **Step 4: Author the four deck files**

Each file follows this exact pattern (shown for `src/decks/classic.ts`):

```ts
import type { Card } from './types';

const c = (word: string, ...taboo: [string, string, string, string, string]): Card =>
  ({ word, taboo, category: 'classic' });

export const classic: Card[] = [
  c('Umbrella', 'Rain', 'Wet', 'Cover', 'Handle', 'Open'),
  c('Birthday', 'Cake', 'Party', 'Candles', 'Age', 'Celebrate'),
  c('Traffic jam', 'Cars', 'Road', 'Stuck', 'Slow', 'Highway'),
  c('Beach', 'Sand', 'Sea', 'Sun', 'Swim', 'Waves'),
  c('Dentist', 'Teeth', 'Doctor', 'Drill', 'Cavity', 'Clean'),
  c('Library', 'Books', 'Quiet', 'Borrow', 'Read', 'Shelves'),
  c('Snowman', 'Winter', 'Carrot', 'Frosty', 'Cold', 'Snow'),
  c('Elevator', 'Lift', 'Floor', 'Buttons', 'Up', 'Down'),
  c('Pillow', 'Bed', 'Sleep', 'Soft', 'Head', 'Cushion'),
  c('Mirror', 'Reflection', 'Glass', 'Look', 'Face', 'Wall'),
  c('Firefighter', 'Fire', 'Hose', 'Truck', 'Rescue', 'Ladder'),
  c('Camping', 'Tent', 'Outdoors', 'Fire', 'Sleeping bag', 'Nature'),
  // extend to at least 60 cards following the authoring rules below
];
```

`src/decks/pop-culture.ts` exports `popCulture` with `category: 'pop-culture'`, starting from:

```
Taylor Swift: Singer, Pop, Eras, Album, Swiftie
Squid Game: Netflix, Korean, Games, Survival, Red light
TikTok: App, Videos, Viral, Scroll, Dance
Harry Potter: Wizard, Hogwarts, Magic, Wand, Voldemort
Batman: Superhero, Gotham, Joker, Cape, Bruce Wayne
Mario: Nintendo, Plumber, Luigi, Mushroom, Jump
Titanic: Ship, Iceberg, Sink, Jack, Rose
Beyonce: Singer, Queen, Destiny's Child, Halo, Jay-Z
Star Wars: Jedi, Lightsaber, Force, Darth Vader, Space
Pokemon: Pikachu, Catch, Trainer, Nintendo, Cards
Friends: Sitcom, Ross, Rachel, Central Perk, TV
Minecraft: Blocks, Build, Creeper, Game, Mine
```

`src/decks/food-drink.ts` exports `foodDrink` with `category: 'food-drink'` (Singaporean and Asian staples included), starting from:

```
Bubble tea: Boba, Pearls, Milk, Straw, Taiwan
Laksa: Noodles, Spicy, Coconut, Soup, Singapore
Durian: Fruit, Smell, Spiky, King, Thorny
Sushi: Japanese, Rice, Fish, Raw, Roll
Kopi: Coffee, Kopitiam, Local, Brew, Uncle
Chicken rice: Hainanese, Singapore, Dish, Chilli, Steamed
Pizza: Italian, Cheese, Slice, Dough, Toppings
Chocolate: Sweet, Cocoa, Candy, Brown, Bar
Ramen: Noodles, Japanese, Broth, Soup, Bowl
Hawker centre: Food, Stalls, Singapore, Cheap, Eat
Ice cream: Cold, Cone, Scoop, Dessert, Frozen
Chilli crab: Seafood, Singapore, Sauce, Spicy, Shell
```

`src/decks/tech-work.ts` exports `techWork` with `category: 'tech-work'`, starting from:

```
Standup meeting: Daily, Scrum, Team, Update, Agile
Wi-Fi: Internet, Wireless, Router, Connect, Password
Deadline: Due, Date, Late, Pressure, Finish
ChatGPT: AI, OpenAI, Chatbot, Ask, Answer
Password: Login, Secret, Account, Type, Forgot
Email: Send, Inbox, Message, Reply, Attachment
Laptop: Computer, Portable, Keyboard, Screen, Work
Overtime: Work, Late, Hours, Extra, Pay
Spreadsheet: Excel, Cells, Rows, Columns, Formula
Zoom: Meeting, Video, Call, Mute, Camera
Bug: Code, Error, Fix, Software, Crash
Promotion: Job, Raise, Boss, Career, Title
```

**Authoring rules for extending each deck to 60+ cards (the test enforces the mechanical ones):**
- The 5 taboo words are the five MOST OBVIOUS clue words a player would reach for first.
- No taboo word equals the target word (case-insensitive); also avoid taboo words that contain the target word or vice versa.
- Words unique within a deck (case-insensitive). Guessable by a general adult audience.
- Keep the deck's theme: classic = everyday objects/activities/places; pop-culture = movies, music, celebrities, games, shows, memes; food-drink = dishes, drinks, ingredients, with generous Singapore/Asia coverage; tech-work = office life, software, gadgets, work rituals.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/decks/decks.test.ts`
Expected: PASS, all four per-deck validations green with 60+ cards each.

- [ ] **Step 6: Commit**

```bash
git add src/decks
git commit -m "feat: four taboo decks with registry and validation"
```

---

### Task 4: Game state types and turn-level reducer

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/gameReducer.ts`
- Create: `src/game/selectors.ts`
- Create: `src/game/testUtils.ts` (shared test helpers, imported by Tasks 5 and 6 tests; never import helpers from a `.test.ts` file, that re-registers its tests in the importer)
- Test: `src/game/gameReducer.test.ts`

**Interfaces:**
- Consumes: `Card` from `../decks/types`.
- Produces (exact, later tasks depend on these):
  - `src/game/types.ts`: `GameMode`, `GameSettings`, `Team`, `CardOutcome`, `TurnResult`, `Phase`, `GameState`, `UndoSnapshot`, `GameAction`.
  - `src/game/gameReducer.ts`: `initialState: GameState`, `gameReducer(state, action): GameState`.
  - `src/game/selectors.ts`: `currentTeam(state): Team | undefined`, `standings(state): Team[]`, `turnScore(state): number`, `gameWinner(state): Team | undefined`.

- [ ] **Step 1: Write the types (no test yet, they only compile)**

`src/game/types.ts`:

```ts
import type { Card, CategoryId } from '../decks/types';

export type GameMode = 'rounds' | 'target' | 'freeplay';

export interface GameSettings {
  timerSeconds: 30 | 60 | 90 | 120;
  mode: GameMode;
  roundsCount: number; // used when mode is 'rounds'
  targetScore: number; // used when mode is 'target'
  deckIds: CategoryId[];
}

export interface Team {
  id: string;
  name: string;
  color: string;
  score: number;
}

export type CardOutcome = 'correct' | 'buzzed' | 'skipped' | 'timeup';

export interface TurnResult {
  card: Card;
  outcome: CardOutcome;
}

export type Phase = 'setup' | 'get-ready' | 'playing' | 'turn-recap' | 'winner';

// one-level undo: fields mutated by CORRECT, BUZZ, SKIP
export interface UndoSnapshot {
  drawPile: Card[];
  usedCards: Card[];
  currentCard: Card | null;
  turnResults: TurnResult[];
  teams: Team[];
}

export interface GameState {
  phase: Phase;
  settings: GameSettings;
  teams: Team[];
  activeTeamIds: string[]; // rotation order, shrinks to tied teams in sudden death
  currentTeamIndex: number; // index into activeTeamIds
  roundNumber: number;
  drawPile: Card[];
  usedCards: Card[];
  currentCard: Card | null;
  turnResults: TurnResult[];
  suddenDeath: boolean;
  reshuffleCount: number;
  undoSnapshot: UndoSnapshot | null;
}

export type GameAction =
  | { type: 'START_GAME'; teams: { id: string; name: string; color: string }[]; settings: GameSettings; shuffledDeck: Card[] }
  | { type: 'START_TURN' }
  | { type: 'CORRECT' }
  | { type: 'BUZZ' }
  | { type: 'SKIP' }
  | { type: 'UNDO' }
  | { type: 'RESHUFFLE'; shuffled: Card[] }
  | { type: 'TIME_UP' }
  | { type: 'CONTINUE' }
  | { type: 'END_GAME' }
  | { type: 'PLAY_AGAIN'; shuffledDeck: Card[] }
  | { type: 'NEW_GAME' };
```

- [ ] **Step 2: Write the test helpers and failing tests**

`src/game/testUtils.ts`:

```ts
import type { Card, CategoryId } from '../decks/types';
import type { GameSettings, GameState } from './types';
import { gameReducer, initialState } from './gameReducer';

export const makeCard = (word: string): Card =>
  ({ word, taboo: ['a', 'b', 'c', 'd', 'e'], category: 'classic' as CategoryId });

export const cards = (n: number) => Array.from({ length: n }, (_, i) => makeCard(`word-${i}`));

export function startedGame(
  overrides: Partial<GameSettings> = {},
  teamCount = 2,
  deckSize = 30,
): GameState {
  const teams = Array.from({ length: teamCount }, (_, i) =>
    ({ id: `t${i}`, name: `Team ${i}`, color: '#fff' }));
  return gameReducer(initialState, {
    type: 'START_GAME',
    teams,
    settings: {
      timerSeconds: 60, mode: 'rounds', roundsCount: 2, targetScore: 20,
      deckIds: ['classic'], ...overrides,
    },
    shuffledDeck: cards(deckSize),
  });
}
```

`src/game/gameReducer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { gameReducer } from './gameReducer';
import { turnScore } from './selectors';
import { startedGame } from './testUtils';

describe('start of game and turn', () => {
  it('START_GAME moves to get-ready with zeroed scores and full pile', () => {
    const s = startedGame();
    expect(s.phase).toBe('get-ready');
    expect(s.teams.map((t) => t.score)).toEqual([0, 0]);
    expect(s.activeTeamIds).toEqual(['t0', 't1']);
    expect(s.drawPile).toHaveLength(30);
    expect(s.roundNumber).toBe(1);
  });

  it('START_TURN draws the first card', () => {
    const s = gameReducer(startedGame(), { type: 'START_TURN' });
    expect(s.phase).toBe('playing');
    expect(s.currentCard?.word).toBe('word-0');
    expect(s.drawPile).toHaveLength(29);
    expect(s.turnResults).toEqual([]);
  });
});

describe('card actions', () => {
  const playing = gameReducer(startedGame(), { type: 'START_TURN' });

  it('CORRECT scores +1, records result, draws next card', () => {
    const s = gameReducer(playing, { type: 'CORRECT' });
    expect(s.teams[0].score).toBe(1);
    expect(s.turnResults).toEqual([{ card: playing.currentCard, outcome: 'correct' }]);
    expect(s.usedCards).toEqual([playing.currentCard]);
    expect(s.currentCard?.word).toBe('word-1');
  });

  it('BUZZ scores -1 and score can go negative', () => {
    const s = gameReducer(playing, { type: 'BUZZ' });
    expect(s.teams[0].score).toBe(-1);
    expect(s.turnResults[0].outcome).toBe('buzzed');
  });

  it('SKIP is free', () => {
    const s = gameReducer(playing, { type: 'SKIP' });
    expect(s.teams[0].score).toBe(0);
    expect(s.turnResults[0].outcome).toBe('skipped');
  });

  it('UNDO reverts exactly one card action', () => {
    const afterCorrect = gameReducer(playing, { type: 'CORRECT' });
    const undone = gameReducer(afterCorrect, { type: 'UNDO' });
    expect(undone.teams[0].score).toBe(0);
    expect(undone.currentCard).toEqual(playing.currentCard);
    expect(undone.turnResults).toEqual([]);
    expect(undone.undoSnapshot).toBeNull();
    // second undo is a no-op
    expect(gameReducer(undone, { type: 'UNDO' })).toBe(undone);
  });

  it('turnScore sums +1 correct, -1 buzzed, 0 otherwise', () => {
    let s = gameReducer(playing, { type: 'CORRECT' });
    s = gameReducer(s, { type: 'CORRECT' });
    s = gameReducer(s, { type: 'BUZZ' });
    s = gameReducer(s, { type: 'SKIP' });
    expect(turnScore(s)).toBe(1);
  });
});

describe('deck edge cases', () => {
  it('drawing from an empty pile leaves currentCard null for the store to reshuffle', () => {
    let s = gameReducer(startedGame({}, 2, 2), { type: 'START_TURN' });
    s = gameReducer(s, { type: 'CORRECT' }); // draws last card
    s = gameReducer(s, { type: 'CORRECT' }); // pile now empty
    expect(s.currentCard).toBeNull();
    expect(s.usedCards).toHaveLength(2);
  });

  it('RESHUFFLE refills the pile from used cards and draws immediately mid turn', () => {
    let s = gameReducer(startedGame({}, 2, 2), { type: 'START_TURN' });
    s = gameReducer(s, { type: 'CORRECT' });
    s = gameReducer(s, { type: 'CORRECT' });
    const shuffled = s.usedCards;
    s = gameReducer(s, { type: 'RESHUFFLE', shuffled });
    expect(s.currentCard).toEqual(shuffled[0]);
    expect(s.usedCards).toEqual([]);
    expect(s.reshuffleCount).toBe(1);
  });
});

describe('TIME_UP', () => {
  it('discards the open card as timeup and moves to recap', () => {
    let s = gameReducer(startedGame(), { type: 'START_TURN' });
    s = gameReducer(s, { type: 'CORRECT' });
    const openCard = s.currentCard;
    s = gameReducer(s, { type: 'TIME_UP' });
    expect(s.phase).toBe('turn-recap');
    expect(s.currentCard).toBeNull();
    expect(s.turnResults[1]).toEqual({ card: openCard, outcome: 'timeup' });
    expect(turnScore(s)).toBe(1); // timeup card scores nothing
    expect(s.undoSnapshot).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/game/gameReducer.test.ts`
Expected: FAIL, cannot resolve `./gameReducer`.

- [ ] **Step 4: Implement reducer and selectors**

`src/game/gameReducer.ts`:

```ts
import type { GameAction, GameState, Team, UndoSnapshot } from './types';

export const initialState: GameState = {
  phase: 'setup',
  settings: { timerSeconds: 60, mode: 'rounds', roundsCount: 3, targetScore: 30, deckIds: [] },
  teams: [],
  activeTeamIds: [],
  currentTeamIndex: 0,
  roundNumber: 1,
  drawPile: [],
  usedCards: [],
  currentCard: null,
  turnResults: [],
  suddenDeath: false,
  reshuffleCount: 0,
  undoSnapshot: null,
};

// draws the next card, leaves currentCard null on an empty pile:
// the store layer detects that and dispatches RESHUFFLE
function draw(state: GameState): GameState {
  if (state.drawPile.length === 0) return { ...state, currentCard: null };
  const [next, ...rest] = state.drawPile;
  return { ...state, currentCard: next, drawPile: rest };
}

function snapshot(state: GameState): UndoSnapshot {
  const { drawPile, usedCards, currentCard, turnResults, teams } = state;
  return { drawPile, usedCards, currentCard, turnResults, teams };
}

function resolveCard(
  state: GameState,
  outcome: 'correct' | 'buzzed' | 'skipped',
  scoreDelta: number,
): GameState {
  if (state.phase !== 'playing' || !state.currentCard) return state;
  const teamId = state.activeTeamIds[state.currentTeamIndex];
  return draw({
    ...state,
    teams: state.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + scoreDelta } : t)),
    usedCards: [...state.usedCards, state.currentCard],
    turnResults: [...state.turnResults, { card: state.currentCard, outcome }],
    undoSnapshot: snapshot(state),
  });
}

function activeTeams(state: GameState): Team[] {
  return state.teams.filter((t) => state.activeTeamIds.includes(t.id));
}

// decides winner or sudden death among the active teams
function declareResult(state: GameState): GameState {
  const active = activeTeams(state);
  const top = Math.max(...active.map((t) => t.score));
  const tied = active.filter((t) => t.score === top);
  if (tied.length > 1) {
    return {
      ...state,
      phase: 'get-ready',
      suddenDeath: true,
      activeTeamIds: tied.map((t) => t.id),
      currentTeamIndex: 0,
      roundNumber: state.roundNumber + 1,
    };
  }
  return { ...state, phase: 'winner' };
}

function endOfRound(state: GameState): GameState {
  const { mode, roundsCount, targetScore } = state.settings;
  const finished = state.suddenDeath
    ? true
    : mode === 'rounds'
      ? state.roundNumber >= roundsCount
      : mode === 'target'
        ? activeTeams(state).some((t) => t.score >= targetScore)
        : false;
  if (!finished) {
    return { ...state, phase: 'get-ready', roundNumber: state.roundNumber + 1, currentTeamIndex: 0 };
  }
  return declareResult(state);
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const teams: Team[] = action.teams.map((t) => ({ ...t, score: 0 }));
      return {
        ...initialState,
        phase: 'get-ready',
        settings: action.settings,
        teams,
        activeTeamIds: teams.map((t) => t.id),
        drawPile: action.shuffledDeck,
      };
    }
    case 'START_TURN': {
      if (state.phase !== 'get-ready') return state;
      return draw({ ...state, phase: 'playing', turnResults: [], undoSnapshot: null });
    }
    case 'CORRECT':
      return resolveCard(state, 'correct', 1);
    case 'BUZZ':
      return resolveCard(state, 'buzzed', -1);
    case 'SKIP':
      return resolveCard(state, 'skipped', 0);
    case 'UNDO': {
      if (!state.undoSnapshot) return state;
      return { ...state, ...state.undoSnapshot, undoSnapshot: null };
    }
    case 'RESHUFFLE': {
      const next = {
        ...state,
        drawPile: action.shuffled,
        usedCards: [],
        reshuffleCount: state.reshuffleCount + 1,
      };
      return state.phase === 'playing' && !state.currentCard ? draw(next) : next;
    }
    case 'TIME_UP': {
      if (state.phase !== 'playing') return state;
      const withCard = state.currentCard
        ? {
            ...state,
            usedCards: [...state.usedCards, state.currentCard],
            turnResults: [...state.turnResults, { card: state.currentCard, outcome: 'timeup' as const }],
            currentCard: null,
          }
        : state;
      return { ...withCard, phase: 'turn-recap', undoSnapshot: null };
    }
    case 'CONTINUE': {
      if (state.phase !== 'turn-recap') return state;
      if (state.currentTeamIndex < state.activeTeamIds.length - 1) {
        return { ...state, phase: 'get-ready', currentTeamIndex: state.currentTeamIndex + 1 };
      }
      return endOfRound(state);
    }
    case 'END_GAME': {
      if (state.phase !== 'get-ready' && state.phase !== 'turn-recap') return state;
      return declareResult(state);
    }
    case 'PLAY_AGAIN': {
      return {
        ...state,
        phase: 'get-ready',
        teams: state.teams.map((t) => ({ ...t, score: 0 })),
        activeTeamIds: state.teams.map((t) => t.id),
        currentTeamIndex: 0,
        roundNumber: 1,
        drawPile: action.shuffledDeck,
        usedCards: [],
        currentCard: null,
        turnResults: [],
        suddenDeath: false,
        reshuffleCount: 0,
        undoSnapshot: null,
      };
    }
    case 'NEW_GAME':
      return initialState;
    default:
      return state;
  }
}
```

`src/game/selectors.ts`:

```ts
import type { GameState, Team } from './types';

export function currentTeam(state: GameState): Team | undefined {
  return state.teams.find((t) => t.id === state.activeTeamIds[state.currentTeamIndex]);
}

export function standings(state: GameState): Team[] {
  return [...state.teams].sort((a, b) => b.score - a.score);
}

export function turnScore(state: GameState): number {
  return state.turnResults.reduce(
    (sum, r) => sum + (r.outcome === 'correct' ? 1 : r.outcome === 'buzzed' ? -1 : 0),
    0,
  );
}

// winner is decided among active teams: after sudden death only tied teams compete
export function gameWinner(state: GameState): Team | undefined {
  if (state.phase !== 'winner') return undefined;
  return state.teams
    .filter((t) => state.activeTeamIds.includes(t.id))
    .sort((a, b) => b.score - a.score)[0];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/game/gameReducer.test.ts`
Expected: PASS (all tests).

- [ ] **Step 6: Commit**

```bash
git add src/game
git commit -m "feat: game reducer with turn actions, undo, reshuffle, selectors"
```

---

### Task 5: Rotation, end conditions, sudden death

**Files:**
- Modify: `src/game/gameReducer.ts` (only if tests reveal gaps, the logic was written in Task 4)
- Test: `src/game/gameFlow.test.ts`

**Interfaces:**
- Consumes: everything from Task 4 (`gameReducer`, `initialState`, `startedGame` re-exported from `src/game/gameReducer.test.ts`).

- [ ] **Step 1: Write the failing tests**

`src/game/gameFlow.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { GameState } from './types';
import { gameReducer } from './gameReducer';
import { gameWinner } from './selectors';
import { makeCard, startedGame } from './testUtils';

// plays one full turn: start, N corrects, M buzzes, time up
function playTurn(state: GameState, corrects: number, buzzes = 0): GameState {
  let s = gameReducer(state, { type: 'START_TURN' });
  for (let i = 0; i < corrects; i++) s = gameReducer(s, { type: 'CORRECT' });
  for (let i = 0; i < buzzes; i++) s = gameReducer(s, { type: 'BUZZ' });
  return gameReducer(s, { type: 'TIME_UP' });
}

const next = (s: GameState) => gameReducer(s, { type: 'CONTINUE' });

describe('team rotation', () => {
  it('CONTINUE advances to the next team within a round', () => {
    let s = playTurn(startedGame({}, 3), 1);
    s = next(s);
    expect(s.phase).toBe('get-ready');
    expect(s.currentTeamIndex).toBe(1);
    expect(s.roundNumber).toBe(1);
  });

  it('completing a round advances roundNumber and resets to team 0', () => {
    let s = startedGame({ roundsCount: 2 }, 2);
    s = next(playTurn(s, 1));
    s = next(playTurn(s, 1));
    expect(s.phase).toBe('get-ready');
    expect(s.currentTeamIndex).toBe(0);
    expect(s.roundNumber).toBe(2);
  });
});

describe('rounds mode', () => {
  it('ends after the configured rounds, highest score wins', () => {
    let s = startedGame({ mode: 'rounds', roundsCount: 1 }, 2);
    s = next(playTurn(s, 3));
    s = next(playTurn(s, 1));
    expect(s.phase).toBe('winner');
    expect(gameWinner(s)?.id).toBe('t0');
  });
});

describe('target mode', () => {
  it('win is only checked at the end of a complete round', () => {
    let s = startedGame({ mode: 'target', targetScore: 3 }, 2);
    s = next(playTurn(s, 3)); // team 0 hits target
    expect(s.phase).toBe('get-ready'); // team 1 still gets its turn
    s = next(playTurn(s, 1));
    expect(s.phase).toBe('winner');
    expect(gameWinner(s)?.id).toBe('t0');
  });

  it('keeps playing rounds until someone reaches the target', () => {
    let s = startedGame({ mode: 'target', targetScore: 5 }, 2);
    s = next(playTurn(s, 2));
    s = next(playTurn(s, 2));
    expect(s.phase).toBe('get-ready');
    expect(s.roundNumber).toBe(2);
  });
});

describe('freeplay mode', () => {
  it('never auto-ends, END_GAME declares the winner', () => {
    let s = startedGame({ mode: 'freeplay' }, 2);
    s = next(playTurn(s, 2));
    s = next(playTurn(s, 1));
    expect(s.phase).toBe('get-ready');
    expect(s.roundNumber).toBe(2);
    s = gameReducer(s, { type: 'END_GAME' });
    expect(s.phase).toBe('winner');
    expect(gameWinner(s)?.id).toBe('t0');
  });
});

describe('sudden death', () => {
  it('tied top teams get extra turns until the tie breaks', () => {
    let s = startedGame({ mode: 'rounds', roundsCount: 1 }, 3);
    s = next(playTurn(s, 2)); // t0: 2
    s = next(playTurn(s, 2)); // t1: 2
    s = next(playTurn(s, 1)); // t2: 1
    expect(s.phase).toBe('get-ready');
    expect(s.suddenDeath).toBe(true);
    expect(s.activeTeamIds).toEqual(['t0', 't1']);
    s = next(playTurn(s, 1)); // t0: 3
    s = next(playTurn(s, 0)); // t1: 2
    expect(s.phase).toBe('winner');
    expect(gameWinner(s)?.id).toBe('t0');
  });

  it('repeats sudden death while still tied', () => {
    let s = startedGame({ mode: 'rounds', roundsCount: 1 }, 2);
    s = next(playTurn(s, 1));
    s = next(playTurn(s, 1)); // tie 1:1
    expect(s.suddenDeath).toBe(true);
    s = next(playTurn(s, 1));
    s = next(playTurn(s, 1)); // still tied 2:2
    expect(s.phase).toBe('get-ready');
    expect(s.suddenDeath).toBe(true);
  });
});

describe('restart actions', () => {
  it('PLAY_AGAIN keeps teams and settings, resets everything else', () => {
    let s = startedGame({ mode: 'rounds', roundsCount: 1 }, 2);
    s = next(playTurn(s, 2));
    s = next(playTurn(s, 1));
    expect(s.phase).toBe('winner');
    s = gameReducer(s, { type: 'PLAY_AGAIN', shuffledDeck: [makeCard('fresh')] });
    expect(s.phase).toBe('get-ready');
    expect(s.teams.map((t) => t.score)).toEqual([0, 0]);
    expect(s.activeTeamIds).toEqual(['t0', 't1']);
    expect(s.roundNumber).toBe(1);
    expect(s.settings.roundsCount).toBe(1);
  });

  it('NEW_GAME returns to a pristine setup state', () => {
    const s = gameReducer(startedGame(), { type: 'NEW_GAME' });
    expect(s.phase).toBe('setup');
    expect(s.teams).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npx vitest run src/game/gameFlow.test.ts`
Expected: PASS if Task 4's implementation is complete. Any FAIL here is a real reducer bug: fix `gameReducer.ts` until green (the intended semantics are exactly these tests).

- [ ] **Step 3: Run the whole suite**

Run: `npm run test`
Expected: PASS, no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/game
git commit -m "test: rotation, end conditions, sudden death, restart flows"
```

---

### Task 6: GameStore with persistence, and React binding

**Files:**
- Create: `src/game/store.ts`
- Create: `src/game/GameContext.tsx`
- Test: `src/game/store.test.ts`

**Interfaces:**
- Consumes: `gameReducer`, `initialState`, `shuffle`, game types.
- Produces:
  - `src/game/store.ts`: `interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }`; `interface GameStore { getState(): GameState; dispatch(action: GameAction): void; subscribe(listener: () => void): () => void }`; `createLocalGameStore(initial?: GameState, storage?: StorageLike | null): GameStore`; `loadSavedState(storage?: StorageLike | null): GameState | null`; `STORAGE_KEY = 'taboo-game-v1'`.
  - `src/game/GameContext.tsx`: `GameProvider({ store, children })`, `useGame(): { state: GameState; dispatch: (a: GameAction) => void }`.

- [ ] **Step 1: Write the failing tests**

`src/game/store.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, createLocalGameStore, loadSavedState, type StorageLike } from './store';
import { initialState } from './gameReducer';
import { startedGame } from './testUtils';

function fakeStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

describe('createLocalGameStore', () => {
  it('persists a versioned snapshot after every dispatch and notifies subscribers', () => {
    const storage = fakeStorage();
    const store = createLocalGameStore(startedGame(), storage);
    let notified = 0;
    store.subscribe(() => notified++);
    store.dispatch({ type: 'START_TURN' });
    expect(notified).toBe(1);
    const saved = JSON.parse(storage.getItem(STORAGE_KEY)!);
    expect(saved.version).toBe(1);
    expect(saved.state.phase).toBe('playing');
  });

  it('auto-reshuffles when the pile runs dry mid turn', () => {
    const storage = fakeStorage();
    const store = createLocalGameStore(startedGame({}, 2, 2), storage);
    store.dispatch({ type: 'START_TURN' });
    store.dispatch({ type: 'CORRECT' });
    store.dispatch({ type: 'CORRECT' }); // pile empty, store must reshuffle
    const s = store.getState();
    expect(s.phase).toBe('playing');
    expect(s.currentCard).not.toBeNull();
    expect(s.reshuffleCount).toBe(1);
  });
});

describe('loadSavedState', () => {
  it('round-trips a non-playing state exactly', () => {
    const storage = fakeStorage();
    const store = createLocalGameStore(startedGame(), storage);
    store.dispatch({ type: 'START_TURN' });
    store.dispatch({ type: 'CORRECT' });
    store.dispatch({ type: 'TIME_UP' });
    expect(loadSavedState(storage)).toEqual(store.getState());
  });

  it('returns an interrupted turn to get-ready, card back on the pile, scores kept', () => {
    const storage = fakeStorage();
    const store = createLocalGameStore(startedGame(), storage);
    store.dispatch({ type: 'START_TURN' });
    store.dispatch({ type: 'CORRECT' });
    const live = store.getState();
    const loaded = loadSavedState(storage)!;
    expect(loaded.phase).toBe('get-ready');
    expect(loaded.currentCard).toBeNull();
    expect(loaded.turnResults).toEqual([]);
    expect(loaded.drawPile[0]).toEqual(live.currentCard);
    expect(loaded.teams[0].score).toBe(1);
  });

  it('returns null for missing, corrupt, or version-mismatched data', () => {
    const storage = fakeStorage();
    expect(loadSavedState(storage)).toBeNull();
    storage.setItem(STORAGE_KEY, 'not json{');
    expect(loadSavedState(storage)).toBeNull();
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, state: initialState }));
    expect(loadSavedState(storage)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/game/store.test.ts`
Expected: FAIL, cannot resolve `./store`.

- [ ] **Step 3: Implement the store**

`src/game/store.ts`:

```ts
import type { GameAction, GameState } from './types';
import { gameReducer, initialState } from './gameReducer';
import { shuffle } from './shuffle';

export const STORAGE_KEY = 'taboo-game-v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface GameStore {
  getState(): GameState;
  dispatch(action: GameAction): void;
  subscribe(listener: () => void): () => void;
}

function defaultStorage(): StorageLike | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function createLocalGameStore(
  initial: GameState = initialState,
  storage: StorageLike | null = defaultStorage(),
): GameStore {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(action) {
      state = gameReducer(state, action);
      // reducer leaves currentCard null on an empty pile, refill from used cards
      while (state.phase === 'playing' && !state.currentCard && state.usedCards.length > 0) {
        state = gameReducer(state, { type: 'RESHUFFLE', shuffled: shuffle(state.usedCards) });
      }
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state }));
      } catch {
        // storage full or unavailable, gameplay continues unpersisted
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}

export function loadSavedState(storage: StorageLike | null = defaultStorage()): GameState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version?: number; state?: GameState };
    if (parsed.version !== 1 || !parsed.state?.phase) return null;
    return normalizeLoadedState(parsed.state);
  } catch {
    return null;
  }
}

// an interrupted turn restarts from get-ready, points already earned are kept
function normalizeLoadedState(state: GameState): GameState {
  if (state.phase !== 'playing') return state;
  return {
    ...state,
    phase: 'get-ready',
    currentCard: null,
    turnResults: [],
    drawPile: state.currentCard ? [state.currentCard, ...state.drawPile] : state.drawPile,
    undoSnapshot: null,
  };
}
```

`src/game/GameContext.tsx`:

```tsx
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { GameStore } from './store';

const Ctx = createContext<GameStore | null>(null);

export function GameProvider({ store, children }: { store: GameStore; children: ReactNode }) {
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useGame() {
  const store = useContext(Ctx);
  if (!store) throw new Error('useGame must be used inside GameProvider');
  const state = useSyncExternalStore(store.subscribe, store.getState);
  return { state, dispatch: store.dispatch };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test`
Expected: PASS, full suite green.

- [ ] **Step 5: Commit**

```bash
git add src/game
git commit -m "feat: local game store with persistence, resume normalization, react binding"
```

---

### Task 7: Hooks, Setup screen, app shell

**Files:**
- Create: `src/hooks/useCountdown.ts`, `src/hooks/useSounds.ts`
- Create: `src/components/SetupScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useGame`, `DECKS`, `buildDrawPile`, `shuffle`, `createLocalGameStore`, `loadSavedState`, `initialState`.
- Produces: `useCountdown(totalSeconds: number, onExpire: () => void): number` (remaining seconds, starts on mount); `useSounds(): { tick(): void; buzzer(): void; ding(): void }`; `SetupScreen`, placeholder screens wiring in `App.tsx`.

- [ ] **Step 1: Implement the hooks**

`src/hooks/useCountdown.ts`:

```ts
import { useEffect, useRef, useState } from 'react';

// counts down from totalSeconds starting on mount, calls onExpire once at zero
export function useCountdown(totalSeconds: number, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    const endAt = Date.now() + totalSeconds * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        expireRef.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [totalSeconds]);

  return remaining;
}
```

`src/hooks/useSounds.ts`:

```ts
import { useRef } from 'react';

// synthesized beeps via web audio, no audio assets needed
export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  function beep(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
    try {
      const ac = (ctxRef.current ??= new AudioContext());
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch {
      // audio blocked or unsupported, play silently
    }
  }

  return {
    tick: () => beep(880, 0.04),
    buzzer: () => beep(140, 0.7, 'sawtooth', 0.15),
    ding: () => beep(1320, 0.12, 'sine', 0.1),
  };
}
```

- [ ] **Step 2: Implement the Setup screen**

`src/components/SetupScreen.tsx`:

```tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGame } from '@/game/GameContext';
import { DECKS, buildDrawPile } from '@/decks';
import type { CategoryId } from '@/decks/types';
import type { GameMode } from '@/game/types';
import { shuffle } from '@/game/shuffle';

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
const TIMERS = [30, 60, 90, 120] as const;
const MODES: { id: GameMode; label: string }[] = [
  { id: 'rounds', label: 'Fixed rounds' },
  { id: 'target', label: 'Race to score' },
  { id: 'freeplay', label: 'Freeplay' },
];

export function SetupScreen() {
  const { dispatch } = useGame();
  const [names, setNames] = useState(['Team 1', 'Team 2']);
  const [deckIds, setDeckIds] = useState<CategoryId[]>(['classic']);
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(60);
  const [mode, setMode] = useState<GameMode>('rounds');
  const [roundsCount, setRoundsCount] = useState(3);
  const [targetScore, setTargetScore] = useState(30);

  const canStart = names.length >= 2 && names.every((n) => n.trim()) && deckIds.length > 0;

  function toggleDeck(id: CategoryId) {
    setDeckIds((ids) => (ids.includes(id) ? ids.filter((d) => d !== id) : [...ids, id]));
  }

  function start() {
    dispatch({
      type: 'START_GAME',
      teams: names.map((name, i) => ({
        id: crypto.randomUUID(),
        name: name.trim(),
        color: TEAM_COLORS[i % TEAM_COLORS.length],
      })),
      settings: { timerSeconds: timer, mode, roundsCount, targetScore, deckIds },
      shuffledDeck: shuffle(buildDrawPile(deckIds)),
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-4">
      <h1 className="pt-4 text-center text-4xl font-black tracking-tight">TABOO</h1>

      <Card>
        <CardHeader><CardTitle>Teams</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }}
              />
              <Input
                value={name}
                onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
              />
              <Button
                variant="ghost"
                size="icon"
                disabled={names.length <= 2}
                onClick={() => setNames(names.filter((_, j) => j !== i))}
              >
                <X />
              </Button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setNames([...names, `Team ${names.length + 1}`])}>
            Add team
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Decks</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.values(DECKS).map((deck) => (
            <Button
              key={deck.id}
              variant={deckIds.includes(deck.id) ? 'default' : 'outline'}
              onClick={() => toggleDeck(deck.id)}
            >
              {deck.label} ({deck.cards.length})
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rules</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-sm text-muted-foreground">Timer</span>
            {TIMERS.map((t) => (
              <Button key={t} variant={timer === t ? 'default' : 'outline'} onClick={() => setTimer(t)}>
                {t}s
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-sm text-muted-foreground">Game mode</span>
            {MODES.map((m) => (
              <Button key={m.id} variant={mode === m.id ? 'default' : 'outline'} onClick={() => setMode(m.id)}>
                {m.label}
              </Button>
            ))}
          </div>
          {mode === 'rounds' && (
            <label className="flex items-center gap-2 text-sm">
              <span className="w-24 text-muted-foreground">Rounds</span>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={roundsCount}
                onChange={(e) => setRoundsCount(Math.max(1, Number(e.target.value)))}
              />
            </label>
          )}
          {mode === 'target' && (
            <label className="flex items-center gap-2 text-sm">
              <span className="w-24 text-muted-foreground">Target score</span>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={targetScore}
                onChange={(e) => setTargetScore(Math.max(1, Number(e.target.value)))}
              />
            </label>
          )}
        </CardContent>
      </Card>

      <Button size="lg" className="text-lg font-bold" disabled={!canStart} onClick={start}>
        Start game
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Wire the app shell with resume flow and placeholder screens**

Replace `src/App.tsx`:

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { GameProvider, useGame } from '@/game/GameContext';
import { initialState } from '@/game/gameReducer';
import { createLocalGameStore, loadSavedState, type GameStore } from '@/game/store';
import { SetupScreen } from '@/components/SetupScreen';

function Screens() {
  const { state } = useGame();
  switch (state.phase) {
    case 'setup':
      return <SetupScreen />;
    default:
      return <p className="p-8">phase: {state.phase}</p>; // replaced in Tasks 8 and 9
  }
}

export default function App() {
  const [saved] = useState(() => loadSavedState());
  const [store, setStore] = useState<GameStore | null>(() =>
    saved && saved.phase !== 'setup' ? null : createLocalGameStore(saved ?? initialState),
  );

  if (!store) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">Game in progress</h1>
        <p className="text-muted-foreground">Pick up where you left off?</p>
        <div className="flex gap-2">
          <Button onClick={() => setStore(createLocalGameStore(saved!))}>Resume game</Button>
          <Button variant="outline" onClick={() => setStore(createLocalGameStore(initialState))}>
            Start fresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GameProvider store={store}>
      <Screens />
      <Toaster />
    </GameProvider>
  );
}
```

- [ ] **Step 4: Verify in the browser**

Run `npx tsc -b && npm run test` (expect clean), then `npm run dev` and check:
- Setup screen renders with 2 teams, deck chips showing real card counts, timer and mode chips.
- Add team adds "Team 3"; remove buttons disabled at 2 teams; toggling all decks off disables Start.
- Mode chips swap the rounds/target input correctly.
- Pressing Start shows the `phase: get-ready` placeholder, and reloading the page offers Resume/Start fresh.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: countdown and sound hooks, setup screen, app shell with resume"
```

---

### Task 8: GetReady and Play screens

**Files:**
- Create: `src/components/Standings.tsx`, `src/components/GetReadyScreen.tsx`, `src/components/PlayScreen.tsx`
- Modify: `src/App.tsx` (wire the two screens into `Screens`)

**Interfaces:**
- Consumes: `useGame`, selectors, `useCountdown`, `useSounds`, `DECKS`, framer-motion, sonner `toast`.
- Produces: `Standings`, `GetReadyScreen`, `PlayScreen` components.

- [ ] **Step 1: Implement Standings**

`src/components/Standings.tsx`:

```tsx
import { useGame } from '@/game/GameContext';
import { standings } from '@/game/selectors';

export function Standings() {
  const { state } = useGame();
  return (
    <ul className="flex w-full max-w-sm flex-col gap-1">
      {standings(state).map((team, i) => (
        <li
          key={team.id}
          className={`flex items-center gap-3 rounded-lg bg-card px-4 py-2 ${
            state.activeTeamIds.includes(team.id) ? '' : 'opacity-40'
          }`}
        >
          <span className="w-5 text-sm text-muted-foreground">{i + 1}</span>
          <span className="h-3 w-3 rounded-full" style={{ background: team.color }} />
          <span className="flex-1 truncate font-medium">{team.name}</span>
          <span className="text-xl font-bold tabular-nums">{team.score}</span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Implement GetReadyScreen**

`src/components/GetReadyScreen.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { useGame } from '@/game/GameContext';
import { currentTeam } from '@/game/selectors';
import { Standings } from '@/components/Standings';

export function GetReadyScreen() {
  const { state, dispatch } = useGame();
  const team = currentTeam(state);
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 p-4 pt-10">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        {state.suddenDeath ? 'Sudden death!' : `Round ${state.roundNumber}`}
      </p>
      <h1 className="text-center text-4xl font-black" style={{ color: team?.color }}>
        {team?.name}
      </h1>
      <p className="text-center text-muted-foreground">
        Hand the device to your clue-giver. The other teams watch for taboo words!
      </p>
      <Button
        size="lg"
        className="h-16 w-full max-w-sm text-xl font-bold"
        onClick={() => dispatch({ type: 'START_TURN' })}
      >
        Start turn ({state.settings.timerSeconds}s)
      </Button>
      <Standings />
      {state.settings.mode === 'freeplay' && !state.suddenDeath && (
        <Button variant="outline" onClick={() => dispatch({ type: 'END_GAME' })}>
          End game
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Implement PlayScreen with timer ring, card animation, sounds, reshuffle toast**

`src/components/PlayScreen.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGame } from '@/game/GameContext';
import { currentTeam, turnScore } from '@/game/selectors';
import { useCountdown } from '@/hooks/useCountdown';
import { useSounds } from '@/hooks/useSounds';
import { DECKS } from '@/decks';

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const urgent = remaining <= 10;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - remaining / total)}
          className={urgent ? 'stroke-red-500' : 'stroke-emerald-400'}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-3xl font-bold tabular-nums ${
          urgent ? 'text-red-500' : ''
        }`}
      >
        {remaining}
      </span>
    </div>
  );
}

export function PlayScreen() {
  const { state, dispatch } = useGame();
  const sounds = useSounds();
  const team = currentTeam(state);

  const remaining = useCountdown(state.settings.timerSeconds, () => {
    sounds.buzzer();
    dispatch({ type: 'TIME_UP' });
  });

  useEffect(() => {
    if (remaining <= 10 && remaining > 0) sounds.tick();
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevReshuffles = useRef(state.reshuffleCount);
  useEffect(() => {
    if (state.reshuffleCount > prevReshuffles.current) toast('Deck reshuffled');
    prevReshuffles.current = state.reshuffleCount;
  }, [state.reshuffleCount]);

  const card = state.currentCard;
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold" style={{ color: team?.color }}>{team?.name}</p>
          <p className="text-sm text-muted-foreground">
            This turn: <span className="font-bold tabular-nums">{turnScore(state)}</span>
          </p>
        </div>
        <TimerRing remaining={remaining} total={state.settings.timerSeconds} />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="popLayout">
          {card && (
            <motion.div
              key={`${card.word}-${state.turnResults.length}`}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xl"
            >
              <div className="flex flex-col items-center gap-1 px-4 py-5" style={{ background: team?.color }}>
                <Badge variant="secondary">{DECKS[card.category].label}</Badge>
                <p className="text-center text-3xl font-black uppercase text-white drop-shadow">
                  {card.word}
                </p>
              </div>
              <ul className="flex flex-col divide-y">
                {card.taboo.map((t) => (
                  <li key={t} className="py-2.5 text-center text-lg font-semibold">{t}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="h-16 bg-emerald-600 text-lg font-bold text-white hover:bg-emerald-500"
            onClick={() => { sounds.ding(); dispatch({ type: 'CORRECT' }); }}
          >
            Correct
          </Button>
          <Button
            className="h-16 bg-red-600 text-lg font-bold text-white hover:bg-red-500"
            onClick={() => { sounds.buzzer(); dispatch({ type: 'BUZZ' }); }}
          >
            Taboo!
          </Button>
          <Button variant="secondary" className="h-16 text-lg font-bold" onClick={() => dispatch({ type: 'SKIP' })}>
            Skip
          </Button>
        </div>
        <Button variant="ghost" disabled={!state.undoSnapshot} onClick={() => dispatch({ type: 'UNDO' })}>
          Undo last
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into App**

In `src/App.tsx` extend the `Screens` switch:

```tsx
import { GetReadyScreen } from '@/components/GetReadyScreen';
import { PlayScreen } from '@/components/PlayScreen';
// inside switch:
case 'get-ready':
  return <GetReadyScreen />;
case 'playing':
  return <PlayScreen />;
```

- [ ] **Step 5: Verify in the browser**

`npx tsc -b && npm run test` clean, then `npm run dev`:
- Start a game with a 30s timer: get-ready shows team name, round, standings; Start turn shows a card.
- Correct/Taboo/Skip advance cards, turn tally updates, ding and buzzer sounds play, Undo reverts the last action and is disabled before any action.
- Ring turns red and ticks in the last 10 seconds; at zero a buzzer plays and the placeholder `phase: turn-recap` appears.

- [ ] **Step 6: Commit**

```bash
git add src
git commit -m "feat: get-ready and play screens with timer ring, animations, sounds"
```

---

### Task 9: Recap and Winner screens, README, full playthrough

**Files:**
- Create: `src/components/TurnRecapScreen.tsx`, `src/components/WinnerScreen.tsx`
- Modify: `src/App.tsx`
- Create: `README.md`

**Interfaces:**
- Consumes: `useGame`, selectors, `Standings`, `buildDrawPile`, `shuffle`, canvas-confetti.
- Produces: complete playable game.

- [ ] **Step 1: Implement TurnRecapScreen**

`src/components/TurnRecapScreen.tsx`:

```tsx
import { Button } from '@/components/ui/button';
import { useGame } from '@/game/GameContext';
import { currentTeam, turnScore } from '@/game/selectors';
import { Standings } from '@/components/Standings';
import type { CardOutcome } from '@/game/types';

const OUTCOME_LABELS: Record<CardOutcome, string> = {
  correct: 'Correct',
  buzzed: 'Buzzed',
  skipped: 'Skipped',
  timeup: 'Time up',
};

const OUTCOME_STYLES: Record<CardOutcome, string> = {
  correct: 'text-emerald-400',
  buzzed: 'text-red-400',
  skipped: 'text-muted-foreground',
  timeup: 'text-yellow-400',
};

export function TurnRecapScreen() {
  const { state, dispatch } = useGame();
  const team = currentTeam(state);
  const score = turnScore(state);
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-5 p-4 pt-8">
      <h1 className="text-3xl font-black" style={{ color: team?.color }}>{team?.name}</h1>
      <p className="text-5xl font-black tabular-nums">{score >= 0 ? `+${score}` : score}</p>
      <ul className="flex w-full max-w-sm flex-col gap-1">
        {state.turnResults.map((r, i) => (
          <li key={i} className="flex justify-between rounded-lg bg-card px-4 py-2">
            <span className="font-medium">{r.card.word}</span>
            <span className={`text-sm font-semibold ${OUTCOME_STYLES[r.outcome]}`}>
              {OUTCOME_LABELS[r.outcome]}
            </span>
          </li>
        ))}
      </ul>
      <Standings />
      <Button
        size="lg"
        className="h-14 w-full max-w-sm text-lg font-bold"
        onClick={() => dispatch({ type: 'CONTINUE' })}
      >
        Continue
      </Button>
      {state.settings.mode === 'freeplay' && !state.suddenDeath && (
        <Button variant="outline" onClick={() => dispatch({ type: 'END_GAME' })}>
          End game
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement WinnerScreen**

`src/components/WinnerScreen.tsx`:

```tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { useGame } from '@/game/GameContext';
import { gameWinner } from '@/game/selectors';
import { Standings } from '@/components/Standings';
import { buildDrawPile } from '@/decks';
import { shuffle } from '@/game/shuffle';

export function WinnerScreen() {
  const { state, dispatch } = useGame();
  const winner = gameWinner(state);

  useEffect(() => {
    confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 p-4 pt-12">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Winner</p>
      <h1 className="text-center text-5xl font-black" style={{ color: winner?.color }}>
        {winner?.name}
      </h1>
      <Standings />
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button
          size="lg"
          className="h-14 text-lg font-bold"
          onClick={() =>
            dispatch({
              type: 'PLAY_AGAIN',
              shuffledDeck: shuffle(buildDrawPile(state.settings.deckIds)),
            })
          }
        >
          Play again
        </Button>
        <Button variant="outline" onClick={() => dispatch({ type: 'NEW_GAME' })}>
          New game
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Complete the App switch**

In `src/App.tsx`, replace the `default` placeholder so all five phases render real screens:

```tsx
import { TurnRecapScreen } from '@/components/TurnRecapScreen';
import { WinnerScreen } from '@/components/WinnerScreen';
// switch becomes exhaustive:
case 'turn-recap':
  return <TurnRecapScreen />;
case 'winner':
  return <WinnerScreen />;
```

- [ ] **Step 4: Write README.md**

```markdown
# Taboo

A party companion for playing Taboo in person: card deck, turn timer, scoring, and scoreboard on one shared device.

## Run

npm install
npm run dev

Open the printed URL. With `--host` (default in the dev script) any phone on the same Wi-Fi can open the network URL.

## How to play

+1 per correct guess, -1 when buzzed for a taboo word, skips are free. Configure teams, decks, timer, and game mode on the setup screen. Decks live in `src/decks/*.ts`, add cards by editing those files (each card needs exactly 5 taboo words, validated by `npm run test`).

## Tests

npm run test
```

- [ ] **Step 5: Full verification**

Run: `npx tsc -b && npm run test`
Expected: typecheck clean, full suite green.

Then `npm run dev` and play through the whole game in the browser:
1. Rounds mode, 1 round, 30s timer, 2 teams: play both turns, recap lists outcomes, winner screen fires confetti, Play again restarts at round 1 with zeroed scores, New game returns to setup.
2. Freeplay mode: End game button appears on get-ready and recap and jumps to winner.
3. Engineer a tie (equal corrects per team) and confirm sudden death banner appears and only tied teams rotate.
4. Mid-turn, reload the page: Resume returns to get-ready with scores kept.
5. Setup with all four decks shows combined card count on chips.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: recap and winner screens, readme, complete game flow"
```
