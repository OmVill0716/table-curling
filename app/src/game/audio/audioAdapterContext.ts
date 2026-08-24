import { createContext } from 'react'
import type { AudioAdapter } from './audioAdapter'

export const AudioAdapterContext = createContext<AudioAdapter | null>(null)
