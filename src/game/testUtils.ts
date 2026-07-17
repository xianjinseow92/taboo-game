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
