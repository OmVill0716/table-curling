import type { GameResult, HighScores } from '../game/types'

export const firstPlaceResult: GameResult = {
  stones: [
    {
      id: 'stone-1',
      position: { x: 300, y: 300 },
      inPlay: true,
      score: 100,
    },
    {
      id: 'stone-2',
      position: { x: 330, y: 320 },
      inPlay: true,
      score: 50,
    },
    {
      id: 'stone-3',
      position: { x: 380, y: 360 },
      inPlay: true,
      score: 30,
    },
    {
      id: 'stone-4',
      position: { x: 410, y: 390 },
      inPlay: true,
      score: 10,
    },
    {
      id: 'stone-5',
      position: { x: -40, y: 780 },
      inPlay: false,
      score: 0,
    },
  ],
  totalScore: 190,
  highScoreRank: 1,
}

export const outsideRankingResult: GameResult = {
  stones: firstPlaceResult.stones.map((stone) => ({
    ...stone,
    inPlay: false,
    score: 0,
  })),
  totalScore: 0,
  highScoreRank: null,
}

export const maximumScoreResult: GameResult = {
  stones: firstPlaceResult.stones.map((stone) => ({
    ...stone,
    inPlay: true,
    score: 100,
  })),
  totalScore: 500,
  highScoreRank: 2,
}

export const mockHighScores: HighScores = {
  ICE: {
    SHORT: [
      { score: 430, achievedAt: '2026-08-23T10:00:00+09:00' },
      { score: 350, achievedAt: '2026-08-22T10:00:00+09:00' },
      { score: 280, achievedAt: '2026-08-21T10:00:00+09:00' },
    ],
    MEDIUM: [{ score: 300, achievedAt: '2026-08-20T10:00:00+09:00' }],
    LONG: [],
  },
  WOOD: {
    SHORT: [],
    MEDIUM: [{ score: 240, achievedAt: '2026-08-19T10:00:00+09:00' }],
    LONG: [],
  },
  FELT: {
    SHORT: [],
    MEDIUM: [],
    LONG: [{ score: 170, achievedAt: '2026-08-18T10:00:00+09:00' }],
  },
}
