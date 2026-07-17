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
