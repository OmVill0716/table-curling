import {
  AUDIO_SOURCES,
  AUDIO_VOLUMES,
  COLLISION_AUDIO_TUNING,
  SOUND_EFFECTS,
  type CollisionAudioTuning,
  type SoundEffect,
} from '../../config/audio'
import type { StoneCollisionEvent } from '../types'
import { selectCollisionForPlayback } from './collisionAudioPolicy'

const HAVE_CURRENT_DATA = 2

export interface AudioClip {
  preload: string
  volume: number
  currentTime: number
  readonly readyState: number
  load(): void
  pause(): void
  play(): Promise<void> | void
}

export type AudioClipFactory = (source: string) => AudioClip

export interface AudioAdapter {
  preload(): void
  unlock(): void
  setEnabled(enabled: boolean): void
  play(effect: SoundEffect): boolean
  playCollision(
    candidates: readonly StoneCollisionEvent[],
    physicsElapsedMs: number,
  ): boolean
  dispose(): void
  readonly isDisposed: boolean
}

export interface AudioAdapterOptions {
  readonly createClip?: AudioClipFactory
  readonly collisionTuning?: CollisionAudioTuning
  readonly sources?: Readonly<Record<SoundEffect, string>>
  readonly volumes?: Readonly<Record<SoundEffect, number>>
}

function createBrowserClip(source: string): AudioClip {
  if (typeof Audio === 'undefined') {
    throw new Error('HTML Audio is not available')
  }
  return new Audio(source)
}

export function createAudioAdapter({
  createClip = createBrowserClip,
  collisionTuning = COLLISION_AUDIO_TUNING,
  sources = AUDIO_SOURCES,
  volumes = AUDIO_VOLUMES,
}: AudioAdapterOptions = {}): AudioAdapter {
  const clips = new Map<SoundEffect, AudioClip>()
  let enabled = true
  let unlocked = false
  let disposed = false
  let lastCollisionPlayedAtMs: number | null = null

  const stopAll = () => {
    for (const clip of clips.values()) {
      try {
        clip.pause()
        clip.currentTime = 0
      } catch {
        // Stopping audio is best effort.
      }
    }
  }

  const play = (effect: SoundEffect) => {
    if (disposed || !enabled || !unlocked) {
      return false
    }

    const clip = clips.get(effect)
    if (clip === undefined || clip.readyState < HAVE_CURRENT_DATA) {
      return false
    }

    try {
      clip.currentTime = 0
      clip.volume = volumes[effect]
      const playback = clip.play()
      if (playback instanceof Promise) {
        void playback.catch(() => undefined)
      }
      return true
    } catch {
      return false
    }
  }

  return {
    preload() {
      if (disposed) {
        return
      }

      for (const effect of SOUND_EFFECTS) {
        if (clips.has(effect)) {
          continue
        }

        try {
          const clip = createClip(sources[effect])
          clip.preload = 'auto'
          clip.volume = volumes[effect]
          clip.load()
          clips.set(effect, clip)
        } catch {
          // A failed source stays unavailable and does not block the game.
        }
      }
    },

    unlock() {
      if (!disposed) {
        unlocked = true
      }
    },

    setEnabled(nextEnabled) {
      if (disposed) {
        return
      }
      enabled = nextEnabled
      if (!enabled) {
        stopAll()
      }
    },

    play,

    playCollision(candidates, physicsElapsedMs) {
      if (disposed || !enabled || !unlocked) {
        return false
      }

      const selected = selectCollisionForPlayback(
        candidates,
        physicsElapsedMs,
        lastCollisionPlayedAtMs,
        collisionTuning,
      )
      if (selected === null || !play('stoneCollision')) {
        return false
      }

      lastCollisionPlayedAtMs = physicsElapsedMs
      return true
    },

    dispose() {
      if (disposed) {
        return
      }
      stopAll()
      clips.clear()
      lastCollisionPlayedAtMs = null
      disposed = true
    },

    get isDisposed() {
      return disposed
    },
  }
}

export function createSilentAudioAdapter(): AudioAdapter {
  let disposed = false
  return {
    preload: () => undefined,
    unlock: () => undefined,
    setEnabled: () => undefined,
    play: () => false,
    playCollision: () => false,
    dispose: () => {
      disposed = true
    },
    get isDisposed() {
      return disposed
    },
  }
}
