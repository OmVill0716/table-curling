import { describe, expect, it, vi } from 'vitest'
import {
  MAX_FRAME_DELTA_MS,
  MAX_PHYSICS_STEPS_PER_FRAME,
  PHYSICS_STEP_MS,
  type PhysicsTuning,
} from '../../config/physics'
import { createPhysicsRuntime } from '../../game/runtime/physicsRuntime'

const constantSpeedTuning: PhysicsTuning = {
  minSpeed: 1,
  maxSpeed: 1,
  frictionAir: { ICE: 0, WOOD: 0, FELT: 0 },
  restitution: 0.85,
  stopSpeed: 0,
  stopDurationMs: 250,
}

function runFrameSequence(frameDeltas: readonly number[]) {
  const runtime = createPhysicsRuntime({
    surface: 'WOOD',
    tuning: constantSpeedTuning,
  })
  runtime.addStone('stone-1', { x: 300, y: 1300 })
  runtime.launchStone('stone-1', 100)

  for (const frameDelta of frameDeltas) {
    runtime.advanceFrame(frameDelta)
  }

  return runtime.getSnapshot()
}

describe('Physics Runtime', () => {
  it('Power充電を開始・更新・解放する', () => {
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })

    expect(runtime.startCharging()).toEqual({
      value: 1,
      direction: 'increasing',
    })
    expect(runtime.advanceCharging(750)).toEqual({
      value: 51,
      direction: 'increasing',
    })
    expect(runtime.releaseCharging()).toBe(51)
    expect(runtime.getPowerReading()).toBeNull()
  })

  it('Power充電を投射せずキャンセルする', () => {
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })
    runtime.startCharging()
    runtime.advanceCharging(1000)

    runtime.cancelCharging()

    expect(runtime.getPowerReading()).toBeNull()
    expect(runtime.getSnapshot().stones[0].motionState).toBe('stopped')
  })

  it('Power充電の不正な順序を拒否する', () => {
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })

    expect(() => runtime.advanceCharging(1)).toThrow(
      'Cannot advance charging before it starts',
    )
    expect(() => runtime.releaseCharging()).toThrow(
      'Cannot release charging before it starts',
    )
    runtime.startCharging()
    expect(() => runtime.startCharging()).toThrow(
      'Cannot start charging in the current state',
    )
  })

  it('Power充電時間をPhysics accumulatorへ加えない', () => {
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })
    runtime.startCharging()
    runtime.advanceCharging(1000)

    expect(runtime.getSnapshot()).toMatchObject({ elapsedMs: 0, stepCount: 0 })
    expect(runtime.getDiagnostics().accumulatorMs).toBe(0)
  })

  it('60Hz、120Hz、混合frame列で同じPhysics結果になる', () => {
    const at60Hz = runFrameSequence(
      Array.from({ length: 60 }, () => 1000 / 60),
    )
    const at120Hz = runFrameSequence(
      Array.from({ length: 120 }, () => PHYSICS_STEP_MS),
    )
    const mixed = runFrameSequence(
      Array.from({ length: 30 }, () => [PHYSICS_STEP_MS, 25]).flat(),
    )

    expect(at60Hz.stepCount).toBe(120)
    expect(at120Hz.stepCount).toBe(120)
    expect(mixed.stepCount).toBe(120)
    expect(at60Hz.stones[0].position).toEqual(at120Hz.stones[0].position)
    expect(mixed.stones[0].position).toEqual(at120Hz.stones[0].position)
    expect(at60Hz.stones[0].velocity).toEqual(at120Hz.stones[0].velocity)
  })

  it('大きなframe deltaを100ms・最大12stepへ制限する', () => {
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })
    runtime.launchStone('stone-1', 100)

    const result = runtime.advanceFrame(1000)

    expect(result.appliedFrameDeltaMs).toBe(MAX_FRAME_DELTA_MS)
    expect(result.steps).toBe(MAX_PHYSICS_STEPS_PER_FRAME)
    expect(result.droppedDeltaMs).toBe(900)
    expect(runtime.getSnapshot().stepCount).toBe(12)
    expect(runtime.advanceFrame(0).steps).toBe(0)
  })

  it('snapshotへMatter Bodyを含めない', () => {
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })

    expect(Object.keys(runtime.getSnapshot().stones[0]).sort()).toEqual([
      'angularVelocity',
      'id',
      'motionState',
      'position',
      'speed',
      'velocity',
    ])
  })

  it('全Stone停止時に完了を1回だけ通知する', () => {
    const onComplete = vi.fn()
    const stoppingTuning: PhysicsTuning = {
      ...constantSpeedTuning,
      minSpeed: 0.5,
      maxSpeed: 0.5,
      stopSpeed: 1,
      stopDurationMs: PHYSICS_STEP_MS * 2,
    }
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: stoppingTuning,
      onComplete,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })
    runtime.launchStone('stone-1', 100)

    runtime.advanceFrame(PHYSICS_STEP_MS * 10)
    runtime.advanceFrame(PHYSICS_STEP_MS * 10)

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0]).toMatchObject({
      stepCount: 2,
      isComplete: true,
      stones: [{ id: 'stone-1', motionState: 'stopped' }],
    })
  })

  it('盤外でも完了を1回だけ通知する', () => {
    const onComplete = vi.fn()
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
      onComplete,
    })
    runtime.addStone('stone-1', { x: -30, y: 1300 })
    runtime.launchStone('stone-1', 100)

    runtime.advanceFrame(PHYSICS_STEP_MS)
    runtime.advanceFrame(PHYSICS_STEP_MS)

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete.mock.calls[0][0].stones[0].motionState).toBe(
      'outOfBounds',
    )
  })

  it('dispose後の更新と通知を拒否する', () => {
    const onComplete = vi.fn()
    const runtime = createPhysicsRuntime({
      surface: 'WOOD',
      tuning: constantSpeedTuning,
      onComplete,
    })
    runtime.addStone('stone-1', { x: 300, y: 1300 })
    runtime.launchStone('stone-1', 100)
    runtime.dispose()
    runtime.dispose()

    expect(runtime.isDisposed).toBe(true)
    expect(() => runtime.advanceFrame(PHYSICS_STEP_MS)).toThrow(
      'PhysicsRuntime has been disposed',
    )
    expect(onComplete).not.toHaveBeenCalled()
  })
})
