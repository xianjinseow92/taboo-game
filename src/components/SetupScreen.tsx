import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGame } from '@/game/GameContext';
import { DECKS, buildDrawPile } from '@/decks';
import type { CategoryId } from '@/decks/types';
import type { GameMode } from '@/game/types';
import { shuffle } from '@/game/shuffle';

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];
const TIMERS = [30, 60, 90, 120] as const;
const MODES: { id: GameMode; label: string }[] = [
  { id: 'rounds', label: 'Fixed rounds' },
  { id: 'target', label: 'Race to score' },
  { id: 'freeplay', label: 'Freeplay' },
];

export function SetupScreen() {
  const { dispatch } = useGame();
  const [names, setNames] = useState(['Team 1', 'Team 2']);
  const [deckIds, setDeckIds] = useState<CategoryId[]>(['classic']);
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(60);
  const [mode, setMode] = useState<GameMode>('rounds');
  const [roundsCount, setRoundsCount] = useState(3);
  const [targetScore, setTargetScore] = useState(30);

  const canStart = names.length >= 2 && names.every((n) => n.trim()) && deckIds.length > 0;

  function toggleDeck(id: CategoryId) {
    setDeckIds((ids) => (ids.includes(id) ? ids.filter((d) => d !== id) : [...ids, id]));
  }

  function start() {
    dispatch({
      type: 'START_GAME',
      teams: names.map((name, i) => ({
        id: crypto.randomUUID(),
        name: name.trim(),
        color: TEAM_COLORS[i % TEAM_COLORS.length],
      })),
      settings: { timerSeconds: timer, mode, roundsCount, targetScore, deckIds },
      shuffledDeck: shuffle(buildDrawPile(deckIds)),
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-4">
      <h1 className="pt-4 text-center text-4xl font-black tracking-tight">TABOO</h1>

      <Card>
        <CardHeader><CardTitle>Teams</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }}
              />
              <Input
                value={name}
                onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
              />
              <Button
                variant="ghost"
                size="icon"
                disabled={names.length <= 2}
                onClick={() => setNames(names.filter((_, j) => j !== i))}
              >
                <X />
              </Button>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setNames([...names, `Team ${names.length + 1}`])}>
            Add team
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Decks</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.values(DECKS).map((deck) => (
            <Button
              key={deck.id}
              variant={deckIds.includes(deck.id) ? 'default' : 'outline'}
              onClick={() => toggleDeck(deck.id)}
            >
              {deck.label} ({deck.cards.length})
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rules</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-sm text-muted-foreground">Timer</span>
            {TIMERS.map((t) => (
              <Button key={t} variant={timer === t ? 'default' : 'outline'} onClick={() => setTimer(t)}>
                {t}s
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-24 text-sm text-muted-foreground">Game mode</span>
            {MODES.map((m) => (
              <Button key={m.id} variant={mode === m.id ? 'default' : 'outline'} onClick={() => setMode(m.id)}>
                {m.label}
              </Button>
            ))}
          </div>
          {mode === 'rounds' && (
            <label className="flex items-center gap-2 text-sm">
              <span className="w-24 text-muted-foreground">Rounds</span>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={roundsCount}
                onChange={(e) => setRoundsCount(Math.max(1, Number(e.target.value)))}
              />
            </label>
          )}
          {mode === 'target' && (
            <label className="flex items-center gap-2 text-sm">
              <span className="w-24 text-muted-foreground">Target score</span>
              <Input
                type="number"
                min={1}
                className="w-24"
                value={targetScore}
                onChange={(e) => setTargetScore(Math.max(1, Number(e.target.value)))}
              />
            </label>
          )}
        </CardContent>
      </Card>

      <Button size="lg" className="text-lg font-bold" disabled={!canStart} onClick={start}>
        Start game
      </Button>
    </div>
  );
}
