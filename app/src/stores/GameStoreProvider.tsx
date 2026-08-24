import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import {
  createPersistenceAdapter,
  getBrowserStorage,
  type PersistenceAdapter,
} from '../game/persistence/persistenceAdapter'
import type { GameState, GameStoreDependencies } from './gameStore'
import { createGameStore } from './gameStore'
import { GameStoreContext } from './gameStoreContext'

interface GameStoreProviderProps extends PropsWithChildren {
  readonly initialState?: Partial<GameState>
  readonly now?: GameStoreDependencies['now']
  readonly persistence?: PersistenceAdapter
}

export function GameStoreProvider({
  children,
  initialState,
  now,
  persistence: providedPersistence,
}: GameStoreProviderProps) {
  const [store] = useState(() => {
    const persistence =
      providedPersistence ??
      createPersistenceAdapter(
        initialState === undefined ? getBrowserStorage() : null,
      )

    return createGameStore(
      {
        highScores: persistence.loadHighScores(),
        soundEnabled: persistence.loadSoundEnabled(),
        ...initialState,
      },
      {
        now,
        saveHighScores: (highScores) => {
          persistence.saveHighScores(highScores)
        },
        saveSoundEnabled: (enabled) => {
          persistence.saveSoundEnabled(enabled)
        },
      },
    )
  })

  return (
    <GameStoreContext.Provider value={store}>
      {children}
    </GameStoreContext.Provider>
  )
}
