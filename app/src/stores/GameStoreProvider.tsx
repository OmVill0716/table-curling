import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { GameState } from './gameStore'
import { createGameStore } from './gameStore'
import { GameStoreContext } from './gameStoreContext'

interface GameStoreProviderProps extends PropsWithChildren {
  readonly initialState?: Partial<GameState>
}

export function GameStoreProvider({
  children,
  initialState,
}: GameStoreProviderProps) {
  const [store] = useState(() => createGameStore(initialState))

  return (
    <GameStoreContext.Provider value={store}>
      {children}
    </GameStoreContext.Provider>
  )
}
