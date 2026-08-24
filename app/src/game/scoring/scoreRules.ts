import { TARGET_CENTER } from '../../config/physics'
import type { StoneScore, Vector2 } from '../types'

export const SCORE_COLORS: Readonly<Record<StoneScore, string>> = {
  0: '#757575',
  10: '#1976D2',
  30: '#FBC02D',
  50: '#F57C00',
  100: '#D32F2F',
}

export function getScoreForPosition(position: Vector2): StoneScore {
  const distance = Math.hypot(
    position.x - TARGET_CENTER.x,
    position.y - TARGET_CENTER.y,
  )

  if (distance <= 30) {
    return 100
  }
  if (distance <= 60) {
    return 50
  }
  if (distance <= 90) {
    return 30
  }
  if (distance <= 120) {
    return 10
  }
  return 0
}
