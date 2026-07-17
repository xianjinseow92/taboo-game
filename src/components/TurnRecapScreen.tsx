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
