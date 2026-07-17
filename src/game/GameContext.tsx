import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { GameStore } from './store';

const Ctx = createContext<GameStore | null>(null);

export function GameProvider({ store, children }: { store: GameStore; children: ReactNode }) {
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useGame() {
  const store = useContext(Ctx);
  if (!store) throw new Error('useGame must be used inside GameProvider');
  const state = useSyncExternalStore(store.subscribe, store.getState);
  return { state, dispatch: store.dispatch };
}
