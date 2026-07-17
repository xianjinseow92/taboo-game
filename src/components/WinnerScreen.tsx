import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { useGame } from '@/game/GameContext';
import { gameWinner } from '@/game/selectors';
import { Standings } from '@/components/Standings';
import { buildDrawPile } from '@/decks';
import { shuffle } from '@/game/shuffle';

export function WinnerScreen() {
  const { state, dispatch } = useGame();
  const winner = gameWinner(state);

  useEffect(() => {
    confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 p-4 pt-12">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">Winner</p>
      <h1 className="text-center text-5xl font-black" style={{ color: winner?.color }}>
        {winner?.name}
      </h1>
      <Standings />
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button
          size="lg"
          className="h-14 text-lg font-bold"
          onClick={() =>
            dispatch({
              type: 'PLAY_AGAIN',
              shuffledDeck: shuffle(buildDrawPile(state.settings.deckIds)),
            })
          }
        >
          Play again
        </Button>
        <Button variant="outline" onClick={() => dispatch({ type: 'NEW_GAME' })}>
          New game
        </Button>
      </div>
    </div>
  );
}
