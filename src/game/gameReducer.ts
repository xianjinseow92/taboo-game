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
