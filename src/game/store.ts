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
