import { describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { AUDIO_SOURCES, AUDIO_VOLUMES } from '../../config/audio'
import {
  createAudioAdapter,
  type AudioClip,
} from '../../game/audio/audioAdapter'
import type { StoneCollisionEvent } from '../../game/types'

interface FakeClip extends AudioClip {
  readyState: number
  readonly load: Mock<() => void>
  readonly pause: Mock<() => void>
  readonly play: Mock<() => Promise<void>>
}

function createFakeClip(readyState = 2): FakeClip {
  return {
    preload: '',
    volume: 1,
    currentTime: 12,
    readyState,
    load: vi.fn<() => void>(),
    pause: vi.fn<() => void>(),
    play: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  }
}

function collision(relativeSpeed: number): StoneCollisionEvent {
  return {
    type: 'stoneCollision',
    stepCount: 1,
    stoneIds: ['stone-1', 'stone-2'],
    relativeSpeed,
  }
}

describe('audioAdapter', () => {
  it('4音源を一度だけ非同期準備する', () => {
    const clips = new Map<string, FakeClip>()
    const adapter = createAudioAdapter({
      createClip: (source) => {
        const clip = createFakeClip()
        clips.set(source, clip)
        return clip
      },
    })

    adapter.preload()
    adapter.preload()

    expect([...clips.keys()]).toEqual(Object.values(AUDIO_SOURCES))
    for (const [effect, source] of Object.entries(AUDIO_SOURCES)) {
      const clip = clips.get(source)!
      expect(clip.preload).toBe('auto')
      expect(clip.volume).toBe(AUDIO_VOLUMES[effect as keyof typeof AUDIO_VOLUMES])
      expect(clip.load).toHaveBeenCalledOnce()
    }
  })

  it('unlock前、未準備、OFFでは再生しない', () => {
    const clip = createFakeClip(1)
    const adapter = createAudioAdapter({ createClip: () => clip })
    adapter.preload()

    expect(adapter.play('shot')).toBe(false)
    adapter.unlock()
    expect(adapter.play('shot')).toBe(false)
    clip.readyState = 2
    adapter.setEnabled(false)
    expect(adapter.play('shot')).toBe(false)
    expect(clip.pause).toHaveBeenCalled()
  })

  it('準備済み音源を先頭から指定音量で再生する', () => {
    const clips = new Map<string, FakeClip>()
    const adapter = createAudioAdapter({
      createClip: (source) => {
        const clip = createFakeClip()
        clips.set(source, clip)
        return clip
      },
    })
    adapter.preload()
    adapter.unlock()

    expect(adapter.play('stoneCollision')).toBe(true)

    const clip = clips.get(AUDIO_SOURCES.stoneCollision)!
    expect(clip.currentTime).toBe(0)
    expect(clip.volume).toBe(0.35)
    expect(clip.play).toHaveBeenCalledOnce()
  })

  it('衝突候補へ閾値とPhysics時間のクールダウンを適用する', () => {
    const clip = createFakeClip()
    const adapter = createAudioAdapter({
      createClip: () => clip,
      collisionTuning: { minRelativeSpeed: 1, cooldownMs: 250 },
    })
    adapter.preload()
    adapter.unlock()

    expect(adapter.playCollision([collision(0.5)], 1000)).toBe(false)
    expect(adapter.playCollision([collision(5)], 1000)).toBe(true)
    expect(adapter.playCollision([collision(8)], 1249)).toBe(false)
    expect(adapter.playCollision([collision(8)], 1250)).toBe(true)
    expect(clip.play).toHaveBeenCalledTimes(2)
  })

  it('読込・play・停止失敗を外へ伝播せずdisposeする', () => {
    const rejected = createFakeClip()
    rejected.play.mockRejectedValue(new Error('blocked'))
    rejected.pause.mockImplementation(() => {
      throw new Error('blocked')
    })
    const adapter = createAudioAdapter({ createClip: () => rejected })

    expect(() => adapter.preload()).not.toThrow()
    adapter.unlock()
    expect(adapter.play('shot')).toBe(true)
    expect(() => adapter.setEnabled(false)).not.toThrow()
    expect(() => adapter.dispose()).not.toThrow()
    expect(() => adapter.dispose()).not.toThrow()
    expect(adapter.isDisposed).toBe(true)
    expect(adapter.play('shot')).toBe(false)
  })

  it('生成失敗した音源をキューせずゲームを継続する', () => {
    const adapter = createAudioAdapter({
      createClip: () => {
        throw new Error('unsupported')
      },
    })

    expect(() => adapter.preload()).not.toThrow()
    adapter.unlock()
    expect(adapter.play('shot')).toBe(false)
  })
})
