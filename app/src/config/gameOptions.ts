import type { Surface, ThrowDistance } from '../game/types'

export interface GameOptionDetails<T extends string> {
  readonly value: T
  readonly label: string
  readonly description: string
}

export const SURFACE_OPTIONS: readonly GameOptionDetails<Surface>[] = [
  {
    value: 'ICE',
    label: 'ICE',
    description: 'よく滑り、ストーンが長く進むフィールド',
  },
  {
    value: 'WOOD',
    label: 'WOOD',
    description: '滑りと止まりのバランスがよいフィールド',
  },
  {
    value: 'FELT',
    label: 'FELT',
    description: '抵抗が強く、ストーンが早く止まるフィールド',
  },
] as const

export const THROW_DISTANCE_OPTIONS: readonly GameOptionDetails<ThrowDistance>[] =
  [
    {
      value: 'SHORT',
      label: 'SHORT',
      description: 'ターゲットに近い位置から投げる',
    },
    {
      value: 'MEDIUM',
      label: 'MEDIUM',
      description: '標準の位置から投げる',
    },
    {
      value: 'LONG',
      label: 'LONG',
      description: 'ターゲットから遠い位置から投げる',
    },
  ] as const

export function getSurfaceDetails(surface: Surface) {
  return SURFACE_OPTIONS.find((option) => option.value === surface)!
}

export function getThrowDistanceDetails(distance: ThrowDistance) {
  return THROW_DISTANCE_OPTIONS.find((option) => option.value === distance)!
}
