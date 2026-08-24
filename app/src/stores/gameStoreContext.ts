import { createContext } from 'react'
import type { GameStoreApi } from './gameStore'

export const GameStoreContext = createContext<GameStoreApi | null>(null)
