import { useContext } from 'react'
import { useStore } from 'zustand'
import type { GameStore } from './gameStore'
import { GameStoreContext } from './gameStoreContext'

export function useGameStore<T>(selector: (store: GameStore) => T): T {
  const store = useContext(GameStoreContext)
  if (store === null) {
    throw new Error('useGameStore must be used within GameStoreProvider')
  }

  return useStore(store, selector)
}
