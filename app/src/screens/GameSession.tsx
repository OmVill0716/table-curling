import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { PHYSICS_TUNING } from '../config/physics'
import { findLaunchPosition } from '../game/physics/gamePhysicsRules'
import {
  createCameraForLaunch,
  type Camera,
} from '../game/renderer/camera'
import { renderGameScene } from '../game/renderer/canvasRenderer'
import type { CanvasViewport } from '../game/renderer/canvasSizing'
import {
  createAnimationFrameScheduler,
  type AnimationFrameMode,
  type AnimationFrameScheduler,
} from '../game/runtime/animationFrameScheduler'
import {
  createPhysicsRuntime,
  type PhysicsRuntime,
} from '../game/runtime/physicsRuntime'
import { scoreGame } from '../game/scoring/scoreGame'
import type {
  PhysicsSnapshot,
  Surface,
  ThrowDistance,
} from '../game/types'
import { useGameStore } from '../stores/useGameStore'
import { GameScreen } from './GameScreen'

interface GameSessionProps {
  readonly surface: Surface
  readonly throwDistance: ThrowDistance
}

const SESSION_ERROR_MESSAGE =
  'ゲーム処理を続行できませんでした。リタイアしてTOPからやり直してください。'

function modeForPhase(
  phase: 'ready' | 'charging' | 'moving' | 'review',
): AnimationFrameMode {
  if (phase === 'charging') {
    return 'charging'
  }
  if (phase === 'moving') {
    return 'moving'
  }
  return 'static'
}

export function GameSession({ surface, throwDistance }: GameSessionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<CanvasViewport | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const runtimeRef = useRef<PhysicsRuntime | null>(null)
  const schedulerRef = useRef<AnimationFrameScheduler | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const gamePhase = useGameStore((store) => store.gamePhase)
  const completedShots = useGameStore((store) => store.completedShots)
  const maxShots = useGameStore((store) => store.maxShots)
  const displayedPower = useGameStore((store) => store.displayedPower)
  const powerDirection = useGameStore((store) => store.powerDirection)
  const retireConfirmationOpen = useGameStore(
    (store) => store.retireConfirmationOpen,
  )
  const resumePhaseAfterRetire = useGameStore(
    (store) => store.resumePhaseAfterRetire,
  )
  const startCharging = useGameStore((store) => store.startCharging)
  const updateDisplayedPower = useGameStore(
    (store) => store.updateDisplayedPower,
  )
  const launchStarted = useGameStore((store) => store.launchStarted)
  const cancelCharging = useGameStore((store) => store.cancelCharging)
  const completeShot = useGameStore((store) => store.completeShot)
  const prepareNextShot = useGameStore((store) => store.prepareNextShot)
  const viewResult = useGameStore((store) => store.viewResult)
  const openRetireConfirmation = useGameStore(
    (store) => store.openRetireConfirmation,
  )
  const closeRetireConfirmation = useGameStore(
    (store) => store.closeRetireConfirmation,
  )
  const confirmRetire = useGameStore((store) => store.confirmRetire)
  const handlePageHidden = useGameStore((store) => store.handlePageHidden)

  const gamePhaseRef = useRef(gamePhase)
  const completedShotsRef = useRef(completedShots)
  const retireConfirmationOpenRef = useRef(retireConfirmationOpen)

  useLayoutEffect(() => {
    gamePhaseRef.current = gamePhase
    completedShotsRef.current = completedShots
    retireConfirmationOpenRef.current = retireConfirmationOpen
  }, [completedShots, gamePhase, retireConfirmationOpen])

  const renderSnapshot = useCallback(
    (snapshot?: PhysicsSnapshot) => {
      const canvas = canvasRef.current
      const viewport = viewportRef.current
      const camera = cameraRef.current
      const runtime = runtimeRef.current

      if (
        canvas === null ||
        viewport === null ||
        viewport.cssWidth <= 0 ||
        viewport.cssHeight <= 0 ||
        camera === null ||
        runtime === null
      ) {
        return
      }

      renderGameScene(canvas, {
        snapshot: snapshot ?? runtime.getSnapshot(),
        camera,
        viewport,
        surface,
      })
    },
    [surface],
  )

  const reportSessionError = useCallback((error: unknown) => {
    console.error(error)
    setSessionError(SESSION_ERROR_MESSAGE)
    schedulerRef.current?.pause()
  }, [])

  useLayoutEffect(() => {
    const launch = findLaunchPosition(throwDistance, [])
    if (!launch.available) {
      queueMicrotask(() => setSessionError(SESSION_ERROR_MESSAGE))
      return
    }

    let runtime: PhysicsRuntime | null = null
    let scheduler: AnimationFrameScheduler | null = null

    try {
      runtime = createPhysicsRuntime({
        surface,
        tuning: PHYSICS_TUNING,
        onComplete: (snapshot) => {
          const nextCompletedShots = completedShotsRef.current + 1
          completeShot(
            snapshot,
            nextCompletedShots === maxShots ? scoreGame(snapshot) : undefined,
          )
          completedShotsRef.current = nextCompletedShots
          gamePhaseRef.current = 'review'
          schedulerRef.current?.setMode('static')
          renderSnapshot(snapshot)
        },
      })
      runtime.addStone('stone-1', launch.position)
      cameraRef.current = createCameraForLaunch(launch.position)
      runtimeRef.current = runtime

      scheduler = createAnimationFrameScheduler({
        clock: { now: () => performance.now() },
        animationFrame: {
          request: (callback) => window.requestAnimationFrame(callback),
          cancel: (requestId) => window.cancelAnimationFrame(requestId),
        },
        onFrame: ({ deltaMs, mode }) => {
          if (mode === 'charging') {
            updateDisplayedPower(runtime!.advanceCharging(deltaMs))
          } else if (mode === 'moving') {
            runtime!.advanceFrame(deltaMs)
          }
          renderSnapshot()
        },
      })
      schedulerRef.current = scheduler
      scheduler.setMode('static')
    } catch (error) {
      scheduler?.dispose()
      runtime?.dispose()
      schedulerRef.current = null
      runtimeRef.current = null
      queueMicrotask(() => reportSessionError(error))
    }

    return () => {
      scheduler?.dispose()
      runtime?.dispose()
      if (schedulerRef.current === scheduler) {
        schedulerRef.current = null
      }
      if (runtimeRef.current === runtime) {
        runtimeRef.current = null
      }
    }
  }, [
    completeShot,
    maxShots,
    renderSnapshot,
    reportSessionError,
    surface,
    throwDistance,
    updateDisplayedPower,
  ])

  useEffect(() => {
    const scheduler = schedulerRef.current
    if (scheduler === null || gamePhase === null) {
      return
    }
    if (
      document.visibilityState === 'hidden' ||
      retireConfirmationOpen
    ) {
      scheduler.pause()
      return
    }

    scheduler.resume()
    scheduler.setMode(modeForPhase(gamePhase))
  }, [gamePhase, retireConfirmationOpen])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const runtime = runtimeRef.current
      const scheduler = schedulerRef.current
      if (runtime === null || scheduler === null) {
        return
      }

      if (document.visibilityState === 'hidden') {
        scheduler.pause()
        if (runtime.getPowerReading() !== null) {
          runtime.cancelCharging()
        }
        if (gamePhaseRef.current === 'charging') {
          gamePhaseRef.current = 'ready'
        }
        handlePageHidden()
        return
      }

      if (retireConfirmationOpenRef.current) {
        return
      }
      if (gamePhaseRef.current === 'moving') {
        runtime.resetAccumulator()
      }
      scheduler.resume()
      scheduler.setMode(modeForPhase(gamePhaseRef.current ?? 'ready'))
      if (
        gamePhaseRef.current === 'ready' ||
        gamePhaseRef.current === 'review'
      ) {
        scheduler.requestRender()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [handlePageHidden])

  const handleCanvasViewportChange = useCallback((viewport: CanvasViewport) => {
    viewportRef.current = viewport
    schedulerRef.current?.requestRender()
  }, [])

  const handleChargeStart = useCallback(() => {
    const runtime = runtimeRef.current
    const scheduler = schedulerRef.current
    if (
      runtime === null ||
      scheduler === null ||
      gamePhaseRef.current !== 'ready' ||
      document.visibilityState === 'hidden'
    ) {
      return
    }

    try {
      startCharging(runtime.startCharging())
      gamePhaseRef.current = 'charging'
      scheduler.setMode('charging')
    } catch (error) {
      reportSessionError(error)
    }
  }, [reportSessionError, startCharging])

  const handleChargeRelease = useCallback(() => {
    const runtime = runtimeRef.current
    const scheduler = schedulerRef.current
    if (
      runtime === null ||
      scheduler === null ||
      runtime.getPowerReading() === null ||
      document.visibilityState === 'hidden'
    ) {
      return
    }

    try {
      const power = runtime.releaseCharging()
      const stoneId = `stone-${completedShotsRef.current + 1}`
      runtime.launchStone(stoneId, power)
      launchStarted()
      gamePhaseRef.current = 'moving'
      scheduler.setMode('moving')
    } catch (error) {
      cancelCharging()
      scheduler.setMode('static')
      reportSessionError(error)
    }
  }, [cancelCharging, launchStarted, reportSessionError])

  const handleChargeCancel = useCallback(() => {
    const runtime = runtimeRef.current
    if (runtime !== null && runtime.getPowerReading() !== null) {
      runtime.cancelCharging()
    }
    cancelCharging()
    gamePhaseRef.current = 'ready'
    schedulerRef.current?.setMode('static')
  }, [cancelCharging])

  const handleNextShot = useCallback(() => {
    const runtime = runtimeRef.current
    const scheduler = schedulerRef.current
    if (
      runtime === null ||
      scheduler === null ||
      gamePhaseRef.current !== 'review' ||
      completedShotsRef.current >= maxShots
    ) {
      return
    }

    const existingStonePositions = runtime
      .getSnapshot()
      .stones.filter(({ motionState }) => motionState !== 'outOfBounds')
      .map(({ position }) => position)
    const launch = findLaunchPosition(throwDistance, existingStonePositions)
    if (!launch.available) {
      reportSessionError(new Error('No launch position is available'))
      return
    }

    try {
      const stoneId = `stone-${completedShotsRef.current + 1}`
      runtime.addStone(stoneId, launch.position)
      cameraRef.current = createCameraForLaunch(launch.position)
      scheduler.setMode('static')
      scheduler.requestRender()
      prepareNextShot()
      gamePhaseRef.current = 'ready'
    } catch (error) {
      reportSessionError(error)
    }
  }, [maxShots, prepareNextShot, reportSessionError, throwDistance])

  const handleOpenRetireConfirmation = useCallback(() => {
    const runtime = runtimeRef.current
    if (runtime !== null && runtime.getPowerReading() !== null) {
      runtime.cancelCharging()
      cancelCharging()
      gamePhaseRef.current = 'ready'
    }
    schedulerRef.current?.pause()
    openRetireConfirmation()
    retireConfirmationOpenRef.current = true
  }, [cancelCharging, openRetireConfirmation])

  const handleCloseRetireConfirmation = useCallback(() => {
    const scheduler = schedulerRef.current
    const runtime = runtimeRef.current
    const resumePhase = resumePhaseAfterRetire
    closeRetireConfirmation()
    retireConfirmationOpenRef.current = false

    if (scheduler === null || resumePhase === null) {
      return
    }
    if (resumePhase === 'moving') {
      runtime?.resetAccumulator()
    }
    scheduler.resume()
    scheduler.setMode(modeForPhase(resumePhase))
  }, [closeRetireConfirmation, resumePhaseAfterRetire])

  const handleConfirmRetire = useCallback(() => {
    schedulerRef.current?.pause()
    confirmRetire()
  }, [confirmRetire])

  if (gamePhase === null) {
    return null
  }

  return (
    <GameScreen
      canvasRef={canvasRef}
      completedShots={completedShots}
      displayedPower={displayedPower}
      gamePhase={gamePhase}
      initializationError={sessionError}
      maxShots={maxShots}
      onCanvasViewportChange={handleCanvasViewportChange}
      onChargeCancel={handleChargeCancel}
      onChargeRelease={handleChargeRelease}
      onChargeStart={handleChargeStart}
      onCloseRetireConfirmation={handleCloseRetireConfirmation}
      onConfirmRetire={handleConfirmRetire}
      onNextShot={handleNextShot}
      onOpenRetireConfirmation={handleOpenRetireConfirmation}
      onViewResult={viewResult}
      powerDirection={powerDirection}
      retireConfirmationOpen={retireConfirmationOpen}
      surface={surface}
      throwDistance={throwDistance}
    />
  )
}
