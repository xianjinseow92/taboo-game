import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, createLocalGameStore, loadSavedState, clearSavedState, type StorageLike } from './store';
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

  it('clearSavedState removes the saved snapshot', () => {
    const storage = fakeStorage();
    const store = createLocalGameStore(startedGame(), storage);
    store.dispatch({ type: 'START_TURN' });
    clearSavedState(storage);
    expect(loadSavedState(storage)).toBeNull();
  });
});
