import { createStore } from 'zustand/vanilla'
import { createEmptyHighScores } from '../config/highScores'
import { addHighScore } from '../game/persistence/highScoreRanking'
import type {
  GameResult,
  HighScores,
  PhysicsSnapshot,
  PowerReading,
  PowerDirection,
  StoneSnapshot,
  Surface,
  ThrowDistance,
} from '../game/types'

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
  readonly displayedPower: number | null
  readonly powerDirection: PowerDirection | null
  readonly settledStones: readonly StoneSnapshot[]
  readonly result: GameResult | null
  readonly highScores: HighScores
  readonly retireConfirmationOpen: boolean
  readonly resumePhaseAfterRetire: GamePhase | null
  readonly soundEnabled: boolean
}

export interface GameStoreDependencies {
  readonly now: () => string
  readonly saveHighScores: (highScores: HighScores) => void
  readonly saveSoundEnabled: (enabled: boolean) => void
}

export interface GameActions {
  readonly openGameSetup: () => void
  readonly openScore: () => void
  readonly openHowToPlay: () => void
  readonly selectSurface: (surface: Surface) => void
  readonly selectThrowDistance: (distance: ThrowDistance) => void
  readonly backFromSetup: () => void
  readonly startGame: () => void
  readonly startCharging: (reading: PowerReading) => void
  readonly updateDisplayedPower: (reading: PowerReading) => void
  readonly launchStarted: () => void
  readonly cancelCharging: () => void
  readonly completeShot: (
    snapshot: PhysicsSnapshot,
    finalResult?: GameResult,
  ) => void
  readonly prepareNextShot: () => void
  readonly viewResult: () => void
  readonly openRetireConfirmation: () => void
  readonly closeRetireConfirmation: () => void
  readonly confirmRetire: () => void
  readonly handlePageHidden: () => void
  readonly retryGame: () => void
  readonly leaveResultForTop: () => void
  readonly returnToTop: () => void
  readonly setSoundEnabled: (enabled: boolean) => void
}

export type GameStore = GameState & GameActions
export type GameStoreApi = ReturnType<typeof createGameStore>

const defaultDependencies: GameStoreDependencies = {
  now: () => new Date().toISOString(),
  saveHighScores: () => undefined,
  saveSoundEnabled: () => undefined,
}

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
    displayedPower: null,
    powerDirection: null,
    settledStones: [],
    result: null,
    highScores: createEmptyHighScores(),
    retireConfirmationOpen: false,
    resumePhaseAfterRetire: null,
    soundEnabled: true,
    ...overrides,
  }
}

export function createGameStore(
  overrides: Partial<GameState> = {},
  dependencies: Partial<GameStoreDependencies> = {},
) {
  const resolvedDependencies: GameStoreDependencies = {
    now: dependencies.now ?? defaultDependencies.now,
    saveHighScores:
      dependencies.saveHighScores ?? defaultDependencies.saveHighScores,
    saveSoundEnabled:
      dependencies.saveSoundEnabled ?? defaultDependencies.saveSoundEnabled,
  }

  return createStore<GameStore>()((set, get) => ({
    ...createInitialGameState(overrides),

    openGameSetup: () => {
      set({
        screen: 'fieldSelect',
        gamePhase: null,
        completedShots: 0,
        displayedPower: null,
        powerDirection: null,
        settledStones: [],
        result: null,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
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
        displayedPower: null,
        powerDirection: null,
        settledStones: [],
        result: null,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
      })
    },

    startCharging: ({ value, direction }) => {
      const { screen, gamePhase, retireConfirmationOpen } = get()
      if (
        screen !== 'game' ||
        gamePhase !== 'ready' ||
        retireConfirmationOpen
      ) {
        return
      }

      set({
        gamePhase: 'charging',
        displayedPower: value,
        powerDirection: direction,
      })
    },

    updateDisplayedPower: ({ value, direction }) => {
      const state = get()
      if (state.screen !== 'game' || state.gamePhase !== 'charging') {
        return
      }
      if (
        state.displayedPower === value &&
        state.powerDirection === direction
      ) {
        return
      }

      set({ displayedPower: value, powerDirection: direction })
    },

    launchStarted: () => {
      if (get().screen !== 'game' || get().gamePhase !== 'charging') {
        return
      }

      set({
        gamePhase: 'moving',
        displayedPower: null,
        powerDirection: null,
      })
    },

    cancelCharging: () => {
      if (get().screen !== 'game' || get().gamePhase !== 'charging') {
        return
      }

      set({
        gamePhase: 'ready',
        displayedPower: null,
        powerDirection: null,
      })
    },

    completeShot: (snapshot, finalResult) => {
      const state = get()
      if (state.screen !== 'game' || state.gamePhase !== 'moving') {
        return
      }

      const completedShots = state.completedShots + 1
      const isFinalShot = completedShots === state.maxShots
      if (completedShots > state.maxShots) {
        return
      }
      if (isFinalShot !== (finalResult !== undefined)) {
        return
      }

      let result = finalResult ?? null
      let highScores = state.highScores

      if (
        finalResult !== undefined &&
        state.surface !== null &&
        state.throwDistance !== null
      ) {
        const update = addHighScore(
          state.highScores,
          state.surface,
          state.throwDistance,
          finalResult.totalScore,
          resolvedDependencies.now(),
        )
        highScores = update.highScores
        result = { ...finalResult, highScoreRank: update.rank }
      }

      set({
        completedShots,
        gamePhase: 'review',
        settledStones: snapshot.stones.map((stone) => ({
          ...stone,
          position: { ...stone.position },
          velocity: { ...stone.velocity },
        })),
        result,
        highScores,
      })

      if (finalResult !== undefined) {
        try {
          resolvedDependencies.saveHighScores(highScores)
        } catch {
          // Persistence is best effort and must not stop the game.
        }
      }
    },

    prepareNextShot: () => {
      const state = get()
      if (
        state.screen !== 'game' ||
        state.gamePhase !== 'review' ||
        state.completedShots < 1 ||
        state.completedShots >= state.maxShots ||
        state.retireConfirmationOpen
      ) {
        return
      }

      set({ gamePhase: 'ready' })
    },

    viewResult: () => {
      const state = get()
      if (
        state.screen !== 'game' ||
        state.gamePhase !== 'review' ||
        state.completedShots !== state.maxShots ||
        state.result === null
      ) {
        return
      }

      set({
        screen: 'result',
        gamePhase: null,
        displayedPower: null,
        powerDirection: null,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
      })
    },

    openRetireConfirmation: () => {
      const state = get()
      if (
        state.screen !== 'game' ||
        state.gamePhase === null ||
        state.completedShots >= state.maxShots ||
        state.result !== null ||
        state.retireConfirmationOpen
      ) {
        return
      }

      const resumePhaseAfterRetire =
        state.gamePhase === 'charging' ? 'ready' : state.gamePhase
      set({
        gamePhase: resumePhaseAfterRetire,
        displayedPower: null,
        powerDirection: null,
        retireConfirmationOpen: true,
        resumePhaseAfterRetire,
      })
    },

    closeRetireConfirmation: () => {
      const state = get()
      if (!state.retireConfirmationOpen) {
        return
      }

      set({
        gamePhase: state.resumePhaseAfterRetire,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
      })
    },

    confirmRetire: () => {
      if (!get().retireConfirmationOpen) {
        return
      }

      set({
        screen: 'top',
        gamePhase: null,
        completedShots: 0,
        displayedPower: null,
        powerDirection: null,
        settledStones: [],
        result: null,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
      })
    },

    handlePageHidden: () => {
      const state = get()
      if (state.screen !== 'game' || state.gamePhase !== 'charging') {
        return
      }

      set({
        gamePhase: 'ready',
        displayedPower: null,
        powerDirection: null,
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
        displayedPower: null,
        powerDirection: null,
        settledStones: [],
        result: null,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
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
        displayedPower: null,
        powerDirection: null,
        settledStones: [],
        result: null,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
      })
    },

    returnToTop: () => {
      set({
        screen: 'top',
        gamePhase: null,
        completedShots: 0,
        displayedPower: null,
        powerDirection: null,
        settledStones: [],
        result: null,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
      })
    },

    setSoundEnabled: (soundEnabled) => {
      if (get().soundEnabled === soundEnabled) {
        return
      }
      set({ soundEnabled })
      try {
        resolvedDependencies.saveSoundEnabled(soundEnabled)
      } catch {
        // Persistence is best effort and must not stop the game.
      }
    },
  }))
}
