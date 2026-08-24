import { useContext } from 'react'
import { AudioAdapterContext } from './audioAdapterContext'

export function useAudioAdapter() {
  const adapter = useContext(AudioAdapterContext)
  if (adapter === null) {
    throw new Error('useAudioAdapter must be used within GameAudioProvider')
  }
  return adapter
}
