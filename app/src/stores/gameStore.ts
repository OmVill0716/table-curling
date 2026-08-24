import { createStore } from 'zustand/vanilla'
import type { GameResult, Surface, ThrowDistance } from '../game/types'

export type Screen =
  | 'top'
  | 'fieldSelect'
  | 'lengthSelect'
  | 'selectionConfirm'
  | 'game'
  | 'result'
  | 'score'
  | 'howToPlay'

export type GamePhase = 'ready' | 'charging' | 'moving' | 'review'

export interface GameState {
  readonly screen: Screen
  readonly surface: Surface | null
  readonly throwDistance: ThrowDistance | null
  readonly gamePhase: GamePhase | null
  readonly completedShots: number
  readonly maxShots: 5
  readonly result: GameResult | null
  readonly soundEnabled: boolean
}

export interface GameActions {
  readonly openGameSetup: () => void
  readonly openScore: () => void
  readonly openHowToPlay: () => void
  readonly selectSurface: (surface: Surface) => void
  readonly selectThrowDistance: (distance: ThrowDistance) => void
  readonly backFromSetup: () => void
  readonly startGame: () => void
  readonly showResult: (result: GameResult) => void
  readonly retryGame: () => void
  readonly leaveResultForTop: () => void
  readonly returnToTop: () => void
  readonly setSoundEnabled: (enabled: boolean) => void
}

export type GameStore = GameState & GameActions
export type GameStoreApi = ReturnType<typeof createGameStore>

export function createInitialGameState(
  overrides: Partial<GameState> = {},
): GameState {
  return {
    screen: 'top',
    surface: null,
    throwDistance: null,
    gamePhase: null,
    completedShots: 0,
    maxShots: 5,
    result: null,
    soundEnabled: true,
    ...overrides,
  }
}

export function createGameStore(overrides: Partial<GameState> = {}) {
  return createStore<GameStore>()((set, get) => ({
    ...createInitialGameState(overrides),

    openGameSetup: () => {
      set({
        screen: 'fieldSelect',
        gamePhase: null,
        completedShots: 0,
        result: null,
      })
    },

    openScore: () => {
      set({ screen: 'score', gamePhase: null })
    },

    openHowToPlay: () => {
      set({ screen: 'howToPlay', gamePhase: null })
    },

    selectSurface: (surface) => {
      set({ screen: 'lengthSelect', surface, gamePhase: null })
    },

    selectThrowDistance: (throwDistance) => {
      if (get().surface === null) {
        return
      }

      set({
        screen: 'selectionConfirm',
        throwDistance,
        gamePhase: null,
      })
    },

    backFromSetup: () => {
      const { screen } = get()
      const previousScreen: Partial<Record<Screen, Screen>> = {
        fieldSelect: 'top',
        lengthSelect: 'fieldSelect',
        selectionConfirm: 'lengthSelect',
      }

      const target = previousScreen[screen]
      if (target !== undefined) {
        set({ screen: target, gamePhase: null })
      }
    },

    startGame: () => {
      const { screen, surface, throwDistance } = get()
      if (
        screen !== 'selectionConfirm' ||
        surface === null ||
        throwDistance === null
      ) {
        return
      }

      set({
        screen: 'game',
        gamePhase: 'ready',
        completedShots: 0,
        result: null,
      })
    },

    showResult: (result) => {
      const { screen, surface, throwDistance } = get()
      if (screen !== 'game' || surface === null || throwDistance === null) {
        return
      }

      set({
        screen: 'result',
        gamePhase: null,
        completedShots: 5,
        result,
      })
    },

    retryGame: () => {
      const { screen, surface, throwDistance } = get()
      if (screen !== 'result' || surface === null || throwDistance === null) {
        return
      }

      set({
        screen: 'game',
        gamePhase: 'ready',
        completedShots: 0,
        result: null,
      })
    },

    leaveResultForTop: () => {
      if (get().screen !== 'result') {
        return
      }

      set({
        screen: 'top',
        surface: null,
        throwDistance: null,
        gamePhase: null,
        completedShots: 0,
        result: null,
      })
    },

    returnToTop: () => {
      set({ screen: 'top', gamePhase: null })
    },

    setSoundEnabled: (soundEnabled) => {
      set({ soundEnabled })
    },
  }))
}
