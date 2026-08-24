import { useState } from 'react'
import type { PropsWithChildren } from 'react'
import {
  createAudioAdapter,
  createSilentAudioAdapter,
  type AudioAdapter,
} from '../game/audio/audioAdapter'
import { GameAudioProvider } from '../game/audio/GameAudioProvider'
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
  readonly audio?: AudioAdapter
  readonly now?: GameStoreDependencies['now']
  readonly persistence?: PersistenceAdapter
}

export function GameStoreProvider({
  children,
  initialState,
  audio: providedAudio,
  now,
  persistence: providedPersistence,
}: GameStoreProviderProps) {
  const [audio] = useState(
    () =>
      providedAudio ??
      (initialState === undefined
        ? createAudioAdapter()
        : createSilentAudioAdapter()),
  )
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
      <GameAudioProvider adapter={audio}>{children}</GameAudioProvider>
    </GameStoreContext.Provider>
  )
}
