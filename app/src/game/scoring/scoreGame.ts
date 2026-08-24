import type { GameResult, PhysicsSnapshot, StoneResult } from '../types'
import { getScoreForPosition } from './scoreRules'

function scoreStone(
  stone: PhysicsSnapshot['stones'][number],
): StoneResult {
  const inPlay = stone.motionState !== 'outOfBounds'

  return {
    id: stone.id,
    position: { ...stone.position },
    inPlay,
    score: inPlay ? getScoreForPosition(stone.position) : 0,
  }
}

export function scoreGame(snapshot: PhysicsSnapshot): GameResult {
  const stones = snapshot.stones.map(scoreStone)

  return {
    stones,
    totalScore: stones.reduce((total, stone) => total + stone.score, 0),
    highScoreRank: null,
  }
}
