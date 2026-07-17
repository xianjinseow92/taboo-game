import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGame } from '@/game/GameContext';
import { currentTeam, turnScore } from '@/game/selectors';
import { useCountdown } from '@/hooks/useCountdown';
import { useSounds } from '@/hooks/useSounds';
import { DECKS } from '@/decks';

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const urgent = remaining <= 10;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="7" className="stroke-muted" />
        <circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - remaining / total)}
          className={urgent ? 'stroke-red-500' : 'stroke-emerald-400'}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-3xl font-bold tabular-nums ${
          urgent ? 'text-red-500' : ''
        }`}
      >
        {remaining}
      </span>
    </div>
  );
}

export function PlayScreen() {
  const { state, dispatch } = useGame();
  const sounds = useSounds();
  const team = currentTeam(state);

  const remaining = useCountdown(state.settings.timerSeconds, () => {
    sounds.buzzer();
    dispatch({ type: 'TIME_UP' });
  });

  useEffect(() => {
    if (remaining <= 10 && remaining > 0) sounds.tick();
  }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevReshuffles = useRef(state.reshuffleCount);
  useEffect(() => {
    if (state.reshuffleCount > prevReshuffles.current) toast('Deck reshuffled');
    prevReshuffles.current = state.reshuffleCount;
  }, [state.reshuffleCount]);

  const card = state.currentCard;
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold" style={{ color: team?.color }}>{team?.name}</p>
          <p className="text-sm text-muted-foreground">
            This turn: <span className="font-bold tabular-nums">{turnScore(state)}</span>
          </p>
        </div>
        <TimerRing remaining={remaining} total={state.settings.timerSeconds} />
      </div>

      <div className="flex flex-1 items-center justify-center">
        <AnimatePresence mode="popLayout">
          {card && (
            <motion.div
              key={`${card.word}-${state.turnResults.length}`}
              initial={{ x: 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xl"
            >
              <div className="flex flex-col items-center gap-1 px-4 py-5" style={{ background: team?.color }}>
                <Badge variant="secondary">{DECKS[card.category].label}</Badge>
                <p className="text-center text-3xl font-black uppercase text-white drop-shadow">
                  {card.word}
                </p>
              </div>
              <ul className="flex flex-col divide-y">
                {card.taboo.map((t) => (
                  <li key={t} className="py-2.5 text-center text-lg font-semibold">{t}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 pb-4">
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="h-16 bg-emerald-600 text-lg font-bold text-white hover:bg-emerald-500"
            onClick={() => { sounds.ding(); dispatch({ type: 'CORRECT' }); }}
          >
            Correct
          </Button>
          <Button
            className="h-16 bg-red-600 text-lg font-bold text-white hover:bg-red-500"
            onClick={() => { sounds.buzzer(); dispatch({ type: 'BUZZ' }); }}
          >
            Taboo!
          </Button>
          <Button variant="secondary" className="h-16 text-lg font-bold" onClick={() => dispatch({ type: 'SKIP' })}>
            Skip
          </Button>
        </div>
        <Button variant="ghost" disabled={!state.undoSnapshot} onClick={() => dispatch({ type: 'UNDO' })}>
          Undo last
        </Button>
      </div>
    </div>
  );
}
