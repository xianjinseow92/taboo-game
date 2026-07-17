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
