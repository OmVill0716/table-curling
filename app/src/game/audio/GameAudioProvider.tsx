import { useEffect, useRef } from 'react'
import type { PropsWithChildren } from 'react'
import { useGameStore } from '../../stores/useGameStore'
import type { AudioAdapter } from './audioAdapter'
import { AudioAdapterContext } from './audioAdapterContext'

interface GameAudioProviderProps extends PropsWithChildren {
  readonly adapter: AudioAdapter
}

export function GameAudioProvider({
  adapter,
  children,
}: GameAudioProviderProps) {
  const soundEnabled = useGameStore((store) => store.soundEnabled)
  const lifecycleRef = useRef(0)

  useEffect(() => {
    const lifecycle = lifecycleRef.current + 1
    lifecycleRef.current = lifecycle
    let listening = true

    const removeUnlockListeners = () => {
      if (!listening) {
        return
      }
      listening = false
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
    const unlock = () => {
      adapter.unlock()
      removeUnlockListeners()
    }

    adapter.preload()
    window.addEventListener('pointerdown', unlock, true)
    window.addEventListener('keydown', unlock, true)

    return () => {
      removeUnlockListeners()
      adapter.setEnabled(false)
      queueMicrotask(() => {
        if (lifecycleRef.current === lifecycle) {
          adapter.dispose()
        }
      })
    }
  }, [adapter])

  useEffect(() => {
    adapter.setEnabled(soundEnabled)
  }, [adapter, soundEnabled])

  return (
    <AudioAdapterContext.Provider value={adapter}>
      {children}
    </AudioAdapterContext.Provider>
  )
}
