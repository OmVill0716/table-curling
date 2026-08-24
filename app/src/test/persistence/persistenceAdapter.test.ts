import { describe, expect, it } from 'vitest'
import { createEmptyHighScores } from '../../config/highScores'
import {
  HIGH_SCORES_STORAGE_KEY,
  SOUND_ENABLED_STORAGE_KEY,
  createPersistenceAdapter,
} from '../../game/persistence/persistenceAdapter'

function createMemoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    values,
  }
}

describe('persistenceAdapter', () => {
  it('未保存時は空のHighScoresとsound ONを返す', () => {
    const adapter = createPersistenceAdapter(createMemoryStorage())

    expect(adapter.loadHighScores()).toEqual(createEmptyHighScores())
    expect(adapter.loadSoundEnabled()).toBe(true)
  })

  it('HighScoresとsound設定を別のv1キーで保存・復元する', () => {
    const storage = createMemoryStorage()
    const adapter = createPersistenceAdapter(storage)
    const highScores = {
      ...createEmptyHighScores(),
      ICE: {
        ...createEmptyHighScores().ICE,
        SHORT: [
          { score: 300, achievedAt: '2026-08-24T10:00:00+09:00' },
        ],
      },
    }

    expect(adapter.saveHighScores(highScores)).toBe(true)
    expect(adapter.saveSoundEnabled(false)).toBe(true)

    expect(JSON.parse(storage.values.get(HIGH_SCORES_STORAGE_KEY)!)).toEqual(
      highScores,
    )
    expect(JSON.parse(storage.values.get(SOUND_ENABLED_STORAGE_KEY)!)).toBe(
      false,
    )
    expect(adapter.loadHighScores()).toEqual(highScores)
    expect(adapter.loadSoundEnabled()).toBe(false)
  })

  it.each([
    '{',
    'null',
    JSON.stringify({ ICE: {}, WOOD: {}, FELT: {} }),
    JSON.stringify({
      ...createEmptyHighScores(),
      FELT: {
        ...createEmptyHighScores().FELT,
        LONG: [{ score: 900, achievedAt: '2026-08-24T10:00:00+09:00' }],
      },
    }),
  ])('破損HighScoresを空記録として扱う: %s', (serialized) => {
    const adapter = createPersistenceAdapter(
      createMemoryStorage({ [HIGH_SCORES_STORAGE_KEY]: serialized }),
    )

    expect(adapter.loadHighScores()).toEqual(createEmptyHighScores())
  })

  it.each(['null', '"false"', '0', '{'])('不正sound値%sをONとして扱う', (serialized) => {
    const adapter = createPersistenceAdapter(
      createMemoryStorage({ [SOUND_ENABLED_STORAGE_KEY]: serialized }),
    )

    expect(adapter.loadSoundEnabled()).toBe(true)
  })

  it('Storageがnullまたは例外でも継続する', () => {
    const unavailable = createPersistenceAdapter(null)
    const throwing = createPersistenceAdapter({
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
    })

    for (const adapter of [unavailable, throwing]) {
      expect(adapter.loadHighScores()).toEqual(createEmptyHighScores())
      expect(adapter.loadSoundEnabled()).toBe(true)
      expect(adapter.saveHighScores(createEmptyHighScores())).toBe(false)
      expect(adapter.saveSoundEnabled(false)).toBe(false)
    }
  })
})
