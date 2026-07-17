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
