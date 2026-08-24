import { Engine } from 'matter-js'
import { describe, expect, it } from 'vitest'
import { createStore } from 'zustand/vanilla'

describe('採用ライブラリの初期化', () => {
  it('Zustandの状態を更新できる', () => {
    const store = createStore<{ count: number }>(() => ({ count: 0 }))

    store.setState({ count: 1 })

    expect(store.getState().count).toBe(1)
  })

  it('Matter.jsの物理エンジンを更新できる', () => {
    const engine = Engine.create({ gravity: { x: 0, y: 0 } })

    Engine.update(engine, 1000 / 60)

    expect(engine.timing.timestamp).toBeCloseTo(1000 / 60)
    Engine.clear(engine)
  })
})
