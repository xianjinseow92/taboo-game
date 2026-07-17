import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { GameProvider, useGame } from '@/game/GameContext';
import { initialState } from '@/game/gameReducer';
import { createLocalGameStore, loadSavedState, clearSavedState, type GameStore } from '@/game/store';
import { SetupScreen } from '@/components/SetupScreen';
import { GetReadyScreen } from '@/components/GetReadyScreen';
import { PlayScreen } from '@/components/PlayScreen';
import { TurnRecapScreen } from '@/components/TurnRecapScreen';
import { WinnerScreen } from '@/components/WinnerScreen';

function Screens() {
  const { state } = useGame();
  switch (state.phase) {
    case 'setup':
      return <SetupScreen />;
    case 'get-ready':
      return <GetReadyScreen />;
    case 'playing':
      return <PlayScreen />;
    case 'turn-recap':
      return <TurnRecapScreen />;
    case 'winner':
      return <WinnerScreen />;
  }
}

export default function App() {
  const [saved] = useState(() => loadSavedState());
  const [store, setStore] = useState<GameStore | null>(() =>
    saved && saved.phase !== 'setup' ? null : createLocalGameStore(saved ?? initialState),
  );

  if (!store) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4">
        <h1 className="text-2xl font-bold">Game in progress</h1>
        <p className="text-muted-foreground">Pick up where you left off?</p>
        <div className="flex gap-2">
          <Button onClick={() => setStore(createLocalGameStore(saved!))}>Resume game</Button>
          <Button
            variant="outline"
            onClick={() => {
              clearSavedState();
              setStore(createLocalGameStore(initialState));
            }}
          >
            Start fresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <GameProvider store={store}>
      <Screens />
      <Toaster />
    </GameProvider>
  );
}
