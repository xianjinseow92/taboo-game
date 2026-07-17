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
