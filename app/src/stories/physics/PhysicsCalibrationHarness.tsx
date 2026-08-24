import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { TARGET_CENTER, getPhysicsTuningErrors } from '../../config/physics'
import { createCameraForLaunch } from '../../game/renderer/camera'
import { renderCalibrationScene } from '../../game/renderer/canvasRenderer'
import {
  fitCanvasCssSize,
  getCanvasViewport,
  resizeCanvas,
  type CanvasViewport,
} from '../../game/renderer/canvasSizing'
import {
  createAnimationFrameScheduler,
  type AnimationFrameScheduler,
} from '../../game/runtime/animationFrameScheduler'
import {
  createPhysicsRuntime,
  type PhysicsRuntime,
} from '../../game/runtime/physicsRuntime'
import type { PhysicsSnapshot, StoneId, Vector2 } from '../../game/types'
import {
  argsToPhysicsTuning,
  type PhysicsCalibrationArgs,
} from './calibrationTypes'
import {
  createCalibrationScene,
  type CalibrationScene,
} from './calibrationPresets'

type HarnessState = 'initial' | 'moving' | 'paused' | 'complete'

interface StoneDiagnostic {
  readonly id: StoneId
  readonly position: Vector2
  readonly speed: number
  readonly travelDistance: number
  readonly motionState: string
}

interface HarnessDiagnostic {
  readonly snapshot: PhysicsSnapshot
  readonly launchSpeed: number | null
  readonly currentTargetDistance: number
  readonly minimumTargetDistance: number
  readonly stones: readonly StoneDiagnostic[]
}

const INITIAL_VIEWPORT = getCanvasViewport(300, 500, 1)

function distanceBetween(a: Vector2, b: Vector2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function describeMotionState(
  motionState: StoneDiagnostic['motionState'],
  harnessState: HarnessState,
) {
  if (motionState === 'outOfBounds') {
    return '盤外'
  }
  if (motionState === 'moving') {
    return '運動中'
  }
  return harnessState === 'initial' ? '未投射' : '速度閾値で停止'
}

function createDiagnostic(
  snapshot: PhysicsSnapshot,
  scene: CalibrationScene,
  startPositions: ReadonlyMap<StoneId, Vector2>,
  launchSpeed: number | null,
  previousMinimumDistance: number,
): HarnessDiagnostic {
  const launchStone = snapshot.stones.find(
    ({ id }) => id === scene.launchId,
  )
  const currentTargetDistance = launchStone
    ? distanceBetween(launchStone.position, TARGET_CENTER)
    : Number.POSITIVE_INFINITY

  return {
    snapshot,
    launchSpeed,
    currentTargetDistance,
    minimumTargetDistance: Math.min(
      previousMinimumDistance,
      currentTargetDistance,
    ),
    stones: snapshot.stones.map((stone) => ({
      id: stone.id,
      position: stone.position,
      speed: stone.speed,
      travelDistance: distanceBetween(
        stone.position,
        startPositions.get(stone.id) ?? stone.position,
      ),
      motionState: stone.motionState,
    })),
  }
}

function initialDiagnostic(scene: CalibrationScene): HarnessDiagnostic {
  const launchPosition = scene.launchPosition
  return {
    snapshot: {
      stones: [],
      elapsedMs: 0,
      stepCount: 0,
      isComplete: false,
    },
    launchSpeed: null,
    currentTargetDistance: distanceBetween(launchPosition, TARGET_CENTER),
    minimumTargetDistance: distanceBetween(launchPosition, TARGET_CENTER),
    stones: [],
  }
}

export function PhysicsCalibrationHarness(args: PhysicsCalibrationArgs) {
  const {
    preset,
    surface,
    distance,
    power,
    minSpeed,
    maxSpeed,
    iceFrictionAir,
    woodFrictionAir,
    feltFrictionAir,
    restitution,
    stopSpeed,
    stopDurationMs,
  } = args
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<CanvasViewport>(INITIAL_VIEWPORT)
  const runtimeRef = useRef<PhysicsRuntime | null>(null)
  const schedulerRef = useRef<AnimationFrameScheduler | null>(null)
  const sceneRef = useRef<CalibrationScene | null>(null)
  const startPositionsRef = useRef<ReadonlyMap<StoneId, Vector2>>(new Map())
  const minimumDistanceRef = useRef(Number.POSITIVE_INFINITY)
  const launchSpeedRef = useRef<number | null>(null)
  const autoLaunchRef = useRef(false)
  const setupGenerationRef = useRef(0)
  const [revision, setRevision] = useState(0)
  const [harnessState, setHarnessState] = useState<HarnessState>('initial')
  const [copyStatus, setCopyStatus] = useState('')
  const tuning = useMemo(
    () =>
      argsToPhysicsTuning({
        preset,
        surface,
        distance,
        power,
        minSpeed,
        maxSpeed,
        iceFrictionAir,
        woodFrictionAir,
        feltFrictionAir,
        restitution,
        stopSpeed,
        stopDurationMs,
      }),
    [
      distance,
      feltFrictionAir,
      iceFrictionAir,
      maxSpeed,
      minSpeed,
      power,
      preset,
      restitution,
      stopDurationMs,
      stopSpeed,
      surface,
      woodFrictionAir,
    ],
  )
  const tuningErrors = useMemo(
    () => getPhysicsTuningErrors(tuning),
    [tuning],
  )
  const initialScene = useMemo(
    () => createCalibrationScene(preset, distance),
    [distance, preset],
  )
  const [diagnostic, setDiagnostic] = useState(() =>
    initialDiagnostic(initialScene),
  )
  const tuningJson = useMemo(
    () =>
      JSON.stringify(
        {
          status: 'ACCEPTED_PHYSICS_TUNING',
          power,
          surface,
          distance,
          ...tuning,
        },
        null,
        2,
      ),
    [distance, power, surface, tuning],
  )

  useLayoutEffect(() => {
    const container = canvasContainerRef.current
    const canvas = canvasRef.current

    if (!container || !canvas) {
      return
    }

    let resizeRequestId: number | null = null
    let pendingWidth = 0
    const updateSize = (availableWidth: number) => {
      const cssSize = fitCanvasCssSize(Math.min(availableWidth, 360), 600)
      const viewport = getCanvasViewport(
        cssSize.width,
        cssSize.height,
        window.devicePixelRatio,
      )

      if (
        viewport.bufferWidth === viewportRef.current.bufferWidth &&
        viewport.bufferHeight === viewportRef.current.bufferHeight &&
        viewport.cssWidth === viewportRef.current.cssWidth &&
        viewport.cssHeight === viewportRef.current.cssHeight
      ) {
        return
      }

      viewportRef.current = viewport
      resizeCanvas(canvas, viewport)
      schedulerRef.current?.requestRender()
    }

    const scheduleSizeUpdate = (availableWidth: number) => {
      pendingWidth = availableWidth
      if (resizeRequestId !== null) {
        return
      }

      resizeRequestId = requestAnimationFrame(() => {
        resizeRequestId = null
        updateSize(pendingWidth)
      })
    }

    updateSize(container.getBoundingClientRect().width || 300)
    const observer = new ResizeObserver(([entry]) => {
      scheduleSizeUpdate(entry.contentRect.width)
    })
    observer.observe(container)

    return () => {
      observer.disconnect()
      if (resizeRequestId !== null) {
        cancelAnimationFrame(resizeRequestId)
      }
    }
  }, [])

  useEffect(() => {
    const setupGeneration = setupGenerationRef.current + 1
    setupGenerationRef.current = setupGeneration
    const afterSetup = (callback: () => void) => {
      queueMicrotask(() => {
        if (setupGenerationRef.current === setupGeneration) {
          callback()
        }
      })
    }

    runtimeRef.current?.dispose()
    schedulerRef.current?.dispose()

    if (tuningErrors.length > 0) {
      runtimeRef.current = null
      schedulerRef.current = null
      afterSetup(() => setHarnessState('initial'))
      return
    }

    const scene = createCalibrationScene(preset, distance)
    const startPositions = new Map(
      scene.stones.map(({ id, position }) => [id, position]),
    )
    const camera = createCameraForLaunch(scene.launchPosition)
    let scheduler: AnimationFrameScheduler | null = null
    const runtime = createPhysicsRuntime({
      surface,
      tuning,
      onComplete: () => {
        scheduler?.setMode('static')
        setHarnessState('complete')
      },
    })
    for (const stone of scene.stones) {
      runtime.addStone(stone.id, stone.position)
    }

    sceneRef.current = scene
    startPositionsRef.current = startPositions
    minimumDistanceRef.current = distanceBetween(
      scene.launchPosition,
      TARGET_CENTER,
    )
    launchSpeedRef.current = null

    const renderCurrentSnapshot = (advancePhysics: boolean, deltaMs: number) => {
      if (advancePhysics) {
        runtime.advanceFrame(deltaMs)
      }

      const snapshot = runtime.getSnapshot()
      const nextDiagnostic = createDiagnostic(
        snapshot,
        scene,
        startPositions,
        launchSpeedRef.current,
        minimumDistanceRef.current,
      )
      minimumDistanceRef.current = nextDiagnostic.minimumTargetDistance
      setDiagnostic(nextDiagnostic)

      const canvas = canvasRef.current
      if (canvas) {
        renderCalibrationScene(canvas, {
          snapshot,
          camera,
          viewport: viewportRef.current,
          surface,
          launchPosition: scene.launchPosition,
        })
      }
    }

    scheduler = createAnimationFrameScheduler({
      clock: { now: () => performance.now() },
      animationFrame: {
        request: (callback) => requestAnimationFrame(callback),
        cancel: (requestId) => cancelAnimationFrame(requestId),
      },
      onFrame: ({ deltaMs, mode }) => {
        renderCurrentSnapshot(mode === 'moving', deltaMs)
      },
    })
    runtimeRef.current = runtime
    schedulerRef.current = scheduler
    const shouldAutoLaunch = autoLaunchRef.current
    afterSetup(() => {
      setHarnessState(shouldAutoLaunch ? 'moving' : 'initial')
      setCopyStatus('')
    })

    if (shouldAutoLaunch) {
      autoLaunchRef.current = false
      const velocity = runtime.launchStone(scene.launchId, power)
      launchSpeedRef.current = Math.hypot(velocity.x, velocity.y)
      scheduler.setMode('moving')
    } else {
      scheduler.setMode('static')
    }

    return () => {
      setupGenerationRef.current += 1
      scheduler?.dispose()
      runtime.dispose()
      if (schedulerRef.current === scheduler) {
        schedulerRef.current = null
      }
      if (runtimeRef.current === runtime) {
        runtimeRef.current = null
      }
    }
  }, [distance, power, preset, revision, surface, tuning, tuningErrors])

  const launch = () => {
    const runtime = runtimeRef.current
    const scheduler = schedulerRef.current
    const scene = sceneRef.current

    if (!runtime || !scheduler || !scene || harnessState !== 'initial') {
      return
    }

    const velocity = runtime.launchStone(scene.launchId, power)
    launchSpeedRef.current = Math.hypot(velocity.x, velocity.y)
    setHarnessState('moving')
    scheduler.setMode('moving')
  }

  const replay = () => {
    autoLaunchRef.current = true
    setRevision((current) => current + 1)
  }

  const reset = () => {
    autoLaunchRef.current = false
    setRevision((current) => current + 1)
  }

  const togglePause = () => {
    const runtime = runtimeRef.current
    const scheduler = schedulerRef.current
    if (!runtime || !scheduler) {
      return
    }

    if (harnessState === 'moving') {
      scheduler.pause()
      setHarnessState('paused')
      return
    }

    if (harnessState === 'paused') {
      runtime.resetAccumulator()
      scheduler.resume()
      setHarnessState('moving')
    }
  }

  const copyTuning = async () => {
    try {
      await navigator.clipboard.writeText(tuningJson)
      setCopyStatus('JSONをClipboardへコピーしました')
    } catch {
      setCopyStatus('Clipboardへコピーできませんでした。表示JSONを手動でコピーしてください')
    }
  }

  return (
    <Paper
      component="section"
      elevation={3}
      sx={{ maxWidth: 980, p: { xs: 2, sm: 3 }, width: '100%' }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography component="h1" variant="h5">
            Physics Calibration: {preset}
          </Typography>
          <Stack
            direction="row"
            sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}
          >
            <Chip color="success" label="承認済み設定" size="small" />
            <Chip label={`${surface} / ${distance}`} size="small" />
            <Chip label={`Power ${power}`} size="small" />
          </Stack>
        </Box>

        {tuningErrors.length > 0 ? (
          <Alert severity="error">
            Runtimeは開始していません: {tuningErrors.join(' / ')}
          </Alert>
        ) : null}

        <Box
          sx={{
            alignItems: 'start',
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(300px, 360px) 1fr' },
          }}
        >
          <Box ref={canvasContainerRef} sx={{ maxWidth: 360, width: '100%' }}>
            <canvas
              aria-label="物理調整盤面"
              ref={canvasRef}
              style={{ borderRadius: 8, display: 'block', maxWidth: '100%' }}
            />
          </Box>

          <Stack spacing={2}>
            <Box
              aria-label="物理調整操作"
              role="group"
              sx={{
                display: 'grid',
                gap: 1,
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              }}
            >
              <Button
                disabled={harnessState !== 'initial' || tuningErrors.length > 0}
                onClick={launch}
                variant="contained"
              >
                投射開始
              </Button>
              <Button
                disabled={tuningErrors.length > 0}
                onClick={replay}
                variant="contained"
              >
                同じ条件で再実行
              </Button>
              <Button
                disabled={
                  harnessState !== 'moving' && harnessState !== 'paused'
                }
                onClick={togglePause}
                variant="contained"
              >
                {harnessState === 'paused' ? '再開' : '一時停止'}
              </Button>
              <Button
                disabled={tuningErrors.length > 0}
                onClick={reset}
                variant="contained"
              >
                初期状態へ戻す
              </Button>
            </Box>

            <Box aria-live="polite">
              <Typography variant="subtitle2">実行状態</Typography>
              <Typography>{harnessState}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2">Physics診断</Typography>
              <Typography component="div" variant="body2">
                初速度: {diagnostic.launchSpeed?.toFixed(3) ?? '未投射'} / step:{' '}
                {diagnostic.snapshot.stepCount} / 経過:{' '}
                {diagnostic.snapshot.elapsedMs.toFixed(1)}ms
              </Typography>
              <Typography component="div" variant="body2">
                ターゲット距離: {diagnostic.currentTargetDistance.toFixed(2)} / 最小:{' '}
                {diagnostic.minimumTargetDistance.toFixed(2)}
              </Typography>
              <Typography component="div" variant="body2">
                投射位置: ({initialScene.launchPosition.x.toFixed(1)},{' '}
                {initialScene.launchPosition.y.toFixed(1)}) / 後退:{' '}
                {initialScene.backtrackSteps}
              </Typography>
            </Box>

            <Stack divider={<Divider flexItem />} spacing={1}>
              {diagnostic.stones.map((stone) => (
                <Box key={stone.id}>
                  <Typography variant="subtitle2">{stone.id}</Typography>
                  <Typography component="div" variant="body2">
                    ({stone.position.x.toFixed(2)}, {stone.position.y.toFixed(2)}) /
                    speed {stone.speed.toFixed(3)} / 移動 {stone.travelDistance.toFixed(2)}
                    {' / '}
                    {describeMotionState(stone.motionState, harnessState)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Box>

        <Divider />
        <Box>
          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 2, mb: 1 }}
          >
            <Typography variant="subtitle2">調整値JSON（自動保存なし）</Typography>
            <Button onClick={copyTuning} size="small" variant="outlined">
              JSONをコピー
            </Button>
          </Stack>
          {copyStatus ? <Alert severity="info">{copyStatus}</Alert> : null}
          <Box
            component="pre"
            sx={{
              bgcolor: 'grey.900',
              borderRadius: 1,
              color: 'grey.100',
              fontSize: 12,
              m: 0,
              overflow: 'auto',
              p: 2,
            }}
          >
            {tuningJson}
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}
