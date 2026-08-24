import {
  SURFACES,
  THROW_DISTANCES,
  type HighScoreRank,
  type HighScoreRecord,
  type HighScores,
  type Surface,
  type ThrowDistance,
} from '../types'

export const MAX_GAME_SCORE = 500
export const MAX_HIGH_SCORES_PER_CATEGORY = 3

const ISO_8601_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/

interface RankedRecord {
  readonly record: HighScoreRecord
  readonly isCandidate: boolean
  readonly inputOrder: number
}

export interface HighScoreUpdate {
  readonly highScores: HighScores
  readonly rank: HighScoreRank | null
}

type HighScoreBuilder = Record<
  Surface,
  Record<ThrowDistance, readonly HighScoreRecord[]>
>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isValidScore(score: unknown): score is number {
  return (
    typeof score === 'number' &&
    Number.isInteger(score) &&
    score >= 0 &&
    score <= MAX_GAME_SCORE
  )
}

export function isValidAchievedAt(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    ISO_8601_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  )
}

function decodeRecord(value: unknown): HighScoreRecord | null {
  if (
    !isRecord(value) ||
    !isValidScore(value.score) ||
    !isValidAchievedAt(value.achievedAt)
  ) {
    return null
  }

  return {
    score: value.score,
    achievedAt: value.achievedAt,
  }
}

function compareRankedRecords(left: RankedRecord, right: RankedRecord) {
  const scoreDifference = right.record.score - left.record.score
  if (scoreDifference !== 0) {
    return scoreDifference
  }

  const timeDifference =
    Date.parse(right.record.achievedAt) - Date.parse(left.record.achievedAt)
  if (timeDifference !== 0) {
    return timeDifference
  }

  if (left.isCandidate !== right.isCandidate) {
    return left.isCandidate ? -1 : 1
  }

  return left.inputOrder - right.inputOrder
}

function sortRecords(records: readonly HighScoreRecord[]) {
  return records
    .map((record, inputOrder) => ({
      record,
      isCandidate: false,
      inputOrder,
    }))
    .sort(compareRankedRecords)
    .slice(0, MAX_HIGH_SCORES_PER_CATEGORY)
    .map(({ record }) => record)
}

export function decodeHighScores(value: unknown): HighScores | null {
  if (!isRecord(value)) {
    return null
  }

  const decoded = {} as HighScoreBuilder

  for (const surface of SURFACES) {
    const surfaceValue = value[surface]
    if (!isRecord(surfaceValue)) {
      return null
    }

    const decodedSurface = {} as Record<
      ThrowDistance,
      readonly HighScoreRecord[]
    >

    for (const distance of THROW_DISTANCES) {
      const categoryValue = surfaceValue[distance]
      if (!Array.isArray(categoryValue)) {
        return null
      }

      const records = categoryValue.map(decodeRecord)
      if (records.some((record) => record === null)) {
        return null
      }

      decodedSurface[distance] = sortRecords(
        records as readonly HighScoreRecord[],
      )
    }

    decoded[surface] = decodedSurface
  }

  return decoded
}

export function addHighScore(
  highScores: HighScores,
  surface: Surface,
  distance: ThrowDistance,
  score: number,
  achievedAt: string,
): HighScoreUpdate {
  if (!isValidScore(score)) {
    throw new RangeError(`score must be an integer from 0 to ${MAX_GAME_SCORE}`)
  }
  if (!isValidAchievedAt(achievedAt)) {
    throw new RangeError('achievedAt must be a valid ISO 8601 date-time')
  }

  const candidate: HighScoreRecord = { score, achievedAt }
  const ranked = [
    ...highScores[surface][distance].map((record, inputOrder) => ({
      record,
      isCandidate: false,
      inputOrder,
    })),
    {
      record: candidate,
      isCandidate: true,
      inputOrder: highScores[surface][distance].length,
    },
  ].sort(compareRankedRecords)
  const candidateIndex = ranked.findIndex(({ isCandidate }) => isCandidate)
  const rank: HighScoreRank | null =
    candidateIndex < MAX_HIGH_SCORES_PER_CATEGORY
      ? ((candidateIndex + 1) as HighScoreRank)
      : null

  return {
    highScores: {
      ...highScores,
      [surface]: {
        ...highScores[surface],
        [distance]: ranked
          .slice(0, MAX_HIGH_SCORES_PER_CATEGORY)
          .map(({ record }) => record),
      },
    },
    rank,
  }
}
