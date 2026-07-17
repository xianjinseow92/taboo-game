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
