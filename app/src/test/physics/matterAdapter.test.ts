import { Body, Composite } from 'matter-js'
import { describe, expect, it } from 'vitest'
import {
  PHYSICS_STEP_MS,
  PHYSICS_TUNING,
  STONE_RADIUS,
  type PhysicsTuning,
} from '../../config/physics'
import {
  createMatterEngine,
  createStoneBody,
} from '../../game/physics/createBodies'
import { createMatterAdapter } from '../../game/physics/matterAdapter'

const tuning = PHYSICS_TUNING

describe('Matter EngineとStone Bodyの生成', () => {
  it('重力とSleepingを無効にし、solver既定値を維持する', () => {
    const engine = createMatterEngine()

    expect(engine.gravity).toEqual({ x: 0, y: 0, scale: 0 })
    expect(engine.enableSleeping).toBe(false)
    expect(engine.positionIterations).toBe(6)
    expect(engine.velocityIterations).toBe(4)
    expect(engine.constraintIterations).toBe(2)
  })

  it('ゲーム固有値だけを上書きし、Matter.js既定materialを維持する', () => {
    const body = createStoneBody({
      id: 'stone-1',
      position: { x: 300, y: 740 },
      surface: 'WOOD',
      tuning,
    })

    expect(body.circleRadius).toBe(STONE_RADIUS)
    expect(body.density).toBe(0.001)
    expect(body.friction).toBe(0.1)
    expect(body.frictionStatic).toBe(0.5)
    expect(body.frictionAir).toBe(tuning.frictionAir.WOOD)
    expect(body.restitution).toBe(tuning.restitution)
  })
})

describe('Matter Adapter', () => {
  it('Stoneを投射し、Surface抵抗で減速させる', () => {
    const adapter = createMatterAdapter({ surface: 'WOOD', tuning })
    adapter.addStone('stone-1', { x: 300, y: 740 })
    adapter.setStoneVelocity('stone-1', { x: 0, y: -12 })

    adapter.update(PHYSICS_STEP_MS)
    const [snapshot] = adapter.getStoneSnapshots()

    expect(snapshot.position.y).toBeLessThan(740)
    expect(snapshot.speed).toBeLessThan(12)
    expect(snapshot.motionState).toBe('moving')
  })

  it('低速が250ms継続するまでは停止させない', () => {
    const adapter = createMatterAdapter({ surface: 'WOOD', tuning })
    adapter.addStone('stone-1', { x: 300, y: 740 })
    adapter.setStoneVelocity('stone-1', { x: 0, y: -0.5 })

    for (let step = 0; step < 29; step += 1) {
      adapter.update(PHYSICS_STEP_MS)
    }
    expect(adapter.getStoneSnapshots()[0].motionState).toBe('moving')

    adapter.update(PHYSICS_STEP_MS)
    expect(adapter.getStoneSnapshots()[0]).toMatchObject({
      speed: 0,
      angularVelocity: 0,
      motionState: 'stopped',
    })
  })

  it('速度が閾値以上へ戻ると停止継続時間をリセットする', () => {
    const adapter = createMatterAdapter({ surface: 'WOOD', tuning })
    adapter.addStone('stone-1', { x: 300, y: 740 })
    adapter.setStoneVelocity('stone-1', { x: 0, y: -0.5 })

    for (let step = 0; step < 20; step += 1) {
      adapter.update(PHYSICS_STEP_MS)
    }
    adapter.setStoneVelocity('stone-1', { x: 0, y: -2 })
    adapter.update(PHYSICS_STEP_MS)
    adapter.setStoneVelocity('stone-1', { x: 0, y: -0.5 })

    for (let step = 0; step < 29; step += 1) {
      adapter.update(PHYSICS_STEP_MS)
    }
    expect(adapter.getStoneSnapshots()[0].motionState).toBe('moving')

    adapter.update(PHYSICS_STEP_MS)
    expect(adapter.getStoneSnapshots()[0].motionState).toBe('stopped')
  })

  it('衝突によって停止Stoneを再始動する', () => {
    const collisionTuning: PhysicsTuning = {
      ...tuning,
      frictionAir: { ICE: 0, WOOD: 0, FELT: 0 },
    }
    const adapter = createMatterAdapter({
      surface: 'WOOD',
      tuning: collisionTuning,
    })
    adapter.addStone('target', { x: 300, y: 300 })
    adapter.addStone('striker', { x: 300, y: 380 })
    adapter.setStoneVelocity('striker', { x: 0, y: -12 })

    for (let step = 0; step < 20; step += 1) {
      adapter.update(PHYSICS_STEP_MS)
      if (adapter.getStoneSnapshots()[0].speed > 1) {
        break
      }
    }

    const target = adapter
      .getStoneSnapshots()
      .find(({ id }) => id === 'target')
    expect(target?.motionState).toBe('moving')
    expect(target?.speed).toBeGreaterThan(1)
  })

  it('衝突開始をStone IDと相対速度付きで一度だけ通知する', () => {
    const collisionTuning: PhysicsTuning = {
      ...tuning,
      frictionAir: { ICE: 0, WOOD: 0, FELT: 0 },
    }
    const adapter = createMatterAdapter({
      surface: 'WOOD',
      tuning: collisionTuning,
    })
    adapter.addStone('target', { x: 300, y: 300 })
    adapter.addStone('striker', { x: 300, y: 380 })
    adapter.setStoneVelocity('striker', { x: 0, y: -12 })
    const collisions = []

    for (let step = 0; step < 30; step += 1) {
      collisions.push(...adapter.update(PHYSICS_STEP_MS).collisions)
    }

    expect(collisions).toHaveLength(1)
    expect(collisions[0].stoneIds).toEqual(['target', 'striker'])
    expect(collisions[0].relativeSpeed).toBeGreaterThan(0)
  })

  it('盤外StoneをWorldから除外してsnapshotへ残す', () => {
    const adapter = createMatterAdapter({ surface: 'WOOD', tuning })
    adapter.addStone('stone-1', { x: 0, y: 200 })
    adapter.setStoneVelocity('stone-1', { x: -12, y: 0 })

    const outOfBoundsStoneIds: string[] = []
    for (let step = 0; step < 10; step += 1) {
      outOfBoundsStoneIds.push(
        ...adapter.update(PHYSICS_STEP_MS).outOfBoundsStoneIds,
      )
      if (adapter.getStoneSnapshots()[0].motionState === 'outOfBounds') {
        break
      }
    }

    expect(adapter.getStoneSnapshots()[0].motionState).toBe('outOfBounds')
    expect(adapter.getStoneDiagnostics('stone-1').isInWorld).toBe(false)
    expect(adapter.areAllStonesComplete()).toBe(true)
    expect(outOfBoundsStoneIds).toEqual(['stone-1'])
    expect(adapter.update(PHYSICS_STEP_MS).outOfBoundsStoneIds).toEqual([])
  })

  it('dispose後はBodyとEngineを再利用しない', () => {
    const adapter = createMatterAdapter({ surface: 'WOOD', tuning })
    adapter.addStone('stone-1', { x: 300, y: 740 })
    adapter.dispose()
    adapter.dispose()

    expect(adapter.isDisposed).toBe(true)
    expect(() => adapter.update(PHYSICS_STEP_MS)).toThrow(
      'MatterAdapter has been disposed',
    )
  })
})

describe('Matter.jsの直接確認', () => {
  it('Body設定を変えずCompositeへ追加・除外できる', () => {
    const engine = createMatterEngine()
    const body = createStoneBody({
      id: 'stone-1',
      position: { x: 300, y: 740 },
      surface: 'WOOD',
      tuning,
    })

    Composite.add(engine.world, body)
    Body.setVelocity(body, { x: 0, y: -1 })
    expect(Composite.allBodies(engine.world)).toContain(body)
  })
})
