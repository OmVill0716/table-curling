import { createEmptyHighScores } from '../../config/highScores'
import type { HighScores } from '../types'
import { decodeHighScores } from './highScoreRanking'

export const HIGH_SCORES_STORAGE_KEY = 'table-curling.high-scores.v1'
export const SOUND_ENABLED_STORAGE_KEY = 'table-curling.sound-enabled.v1'

export interface PersistenceAdapter {
  loadHighScores(): HighScores
  saveHighScores(highScores: HighScores): boolean
  loadSoundEnabled(): boolean
  saveSoundEnabled(enabled: boolean): boolean
}

export function getBrowserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function createPersistenceAdapter(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
): PersistenceAdapter {
  return {
    loadHighScores() {
      if (storage === null) {
        return createEmptyHighScores()
      }

      try {
        const serialized = storage.getItem(HIGH_SCORES_STORAGE_KEY)
        if (serialized === null) {
          return createEmptyHighScores()
        }

        return decodeHighScores(JSON.parse(serialized)) ?? createEmptyHighScores()
      } catch {
        return createEmptyHighScores()
      }
    },

    saveHighScores(highScores) {
      if (storage === null) {
        return false
      }

      try {
        storage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify(highScores))
        return true
      } catch {
        return false
      }
    },

    loadSoundEnabled() {
      if (storage === null) {
        return true
      }

      try {
        const serialized = storage.getItem(SOUND_ENABLED_STORAGE_KEY)
        if (serialized === null) {
          return true
        }

        const value: unknown = JSON.parse(serialized)
        return typeof value === 'boolean' ? value : true
      } catch {
        return true
      }
    },

    saveSoundEnabled(enabled) {
      if (storage === null) {
        return false
      }

      try {
        storage.setItem(SOUND_ENABLED_STORAGE_KEY, JSON.stringify(enabled))
        return true
      } catch {
        return false
      }
    },
  }
}
