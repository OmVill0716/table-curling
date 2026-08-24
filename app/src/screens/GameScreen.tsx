import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import { AppShell } from '../components/AppShell'
import { PowerShotButton } from '../components/PowerShotButton'
import {
  fitCanvasCssSize,
  getCanvasViewport,
  resizeCanvas,
} from '../game/renderer/canvasSizing'
import type { CanvasViewport } from '../game/renderer/canvasSizing'
import type {
  PowerDirection,
  Surface,
  ThrowDistance,
} from '../game/types'
import type { GamePhase } from '../stores/gameStore'

interface GameScreenProps {
  readonly canvasRef?: RefObject<HTMLCanvasElement | null>
  readonly completedShots: number
  readonly displayedPower?: number | null
  readonly gamePhase: GamePhase
  readonly initializationError?: string | null
  readonly isSessionReady?: boolean
  readonly maxShots: number
  readonly onCanvasViewportChange?: (viewport: CanvasViewport) => void
  readonly onChargeCancel?: () => void
  readonly onChargeRelease?: () => void
  readonly onChargeStart?: () => void
  readonly onCloseRetireConfirmation?: () => void
  readonly onConfirmRetire?: () => void
  readonly surface: Surface
  readonly throwDistance: ThrowDistance
  readonly onNextShot?: () => void
  readonly onOpenRetireConfirmation?: () => void
  readonly onViewResult?: () => void
  readonly powerDirection?: PowerDirection | null
  readonly retireConfirmationOpen?: boolean
}

const phaseLabels: Readonly<Record<GamePhase, string>> = {
  ready: '投射準備OK',
  charging: 'Power調整中',
  moving: 'ストーン移動中',
  review: '投射完了',
}

interface GameBoardProps {
  readonly canvasRef?: RefObject<HTMLCanvasElement | null>
  readonly onViewportChange?: (viewport: CanvasViewport) => void
}

function GameBoard({ canvasRef: externalCanvasRef, onViewportChange }: GameBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const internalCanvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = externalCanvasRef ?? internalCanvasRef

  useLayoutEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (container === null || canvas === null) {
      return
    }

    const resize = () => {
      const { width, height } = container.getBoundingClientRect()
      const cssSize = fitCanvasCssSize(width, height)
      const viewport = getCanvasViewport(
        cssSize.width,
        cssSize.height,
        window.devicePixelRatio,
      )
      resizeCanvas(canvas, viewport)
      onViewportChange?.(viewport)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)

    return () => observer.disconnect()
  }, [canvasRef, onViewportChange])

  return (
    <Box
      ref={containerRef}
      sx={{
        alignItems: 'center',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        minHeight: 0,
        minWidth: 0,
        width: '100%',
      }}
    >
      <Box
        aria-describedby="game-board-description"
        aria-label="カーリング盤面"
        component="canvas"
        ref={canvasRef}
        role="img"
        sx={{
          backgroundColor: 'background.paper',
          border: '3px solid',
          borderColor: 'text.primary',
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(21, 48, 71, 0.18)',
          boxSizing: 'border-box',
          display: 'block',
          flex: '0 0 auto',
          touchAction: 'none',
        }}
      />
      <Typography
        id="game-board-description"
        sx={{
          border: 0,
          clip: 'rect(0 0 0 0)',
          height: '1px',
          margin: -1,
          overflow: 'hidden',
          padding: 0,
          position: 'absolute',
          whiteSpace: 'nowrap',
          width: '1px',
        }}
      >
        ターゲットへ向けてストーンを投射する縦長の盤面
      </Typography>
    </Box>
  )
}

export function GameScreen({
  canvasRef,
  completedShots,
  displayedPower = null,
  gamePhase,
  initializationError = null,
  isSessionReady = true,
  maxShots,
  onCanvasViewportChange,
  onChargeCancel,
  onChargeRelease,
  onChargeStart,
  onCloseRetireConfirmation,
  onConfirmRetire,
  onNextShot,
  onOpenRetireConfirmation,
  onViewResult,
  powerDirection = null,
  retireConfirmationOpen = false,
  surface,
  throwDistance,
}: GameScreenProps) {
  const currentShot = Math.min(
    gamePhase === 'review' ? completedShots : completedShots + 1,
    maxShots,
  )
  const isFinalReview = gamePhase === 'review' && completedShots === maxShots
  const canRetire = !isFinalReview && onOpenRetireConfirmation !== undefined
  const showPowerButton = gamePhase === 'ready' || gamePhase === 'charging'

  return (
    <AppShell game maxWidth={1180}>
      <Box
        data-testid="game-layout"
        sx={{
          display: 'grid',
          gap: { xs: 1, sm: 1.5 },
          gridTemplateAreas: '"info" "board" "controls"',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
          height: '100%',
          minHeight: 0,
          '@media (orientation: landscape), (min-width: 900px)': {
            gap: 2,
            gridTemplateAreas: '"board info" "board controls"',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 360px)',
            gridTemplateRows: 'auto minmax(0, 1fr)',
          },
        }}
      >
        <Paper
          component="section"
          elevation={3}
          sx={{ gridArea: 'info', p: { xs: 1.25, sm: 2 } }}
        >
          <Stack
            direction={{ xs: 'row', sm: 'row' }}
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Typography component="h1" sx={{ fontWeight: 900 }} variant="h6">
              Shot {currentShot} / {maxShots}
            </Typography>
            <Chip label={surface} size="small" />
            <Chip label={throwDistance} size="small" variant="outlined" />
            <Chip
              color={gamePhase === 'ready' ? 'primary' : 'secondary'}
              label={phaseLabels[gamePhase]}
              size="small"
              sx={{ marginLeft: { sm: 'auto !important' } }}
            />
          </Stack>
        </Paper>

        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            gridArea: 'board',
            justifyContent: 'center',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <GameBoard
            canvasRef={canvasRef}
            onViewportChange={onCanvasViewportChange}
          />
        </Box>

        <Paper
          component="section"
          elevation={3}
          sx={{ gridArea: 'controls', p: { xs: 1.25, sm: 2 } }}
        >
          <Stack spacing={1.25} sx={{ alignItems: 'stretch' }}>
            {initializationError ? (
              <Typography color="error" role="alert" sx={{ fontWeight: 800 }}>
                {initializationError}
              </Typography>
            ) : null}
            {gamePhase === 'ready' ? (
              <Typography sx={{ fontWeight: 800, textAlign: 'center' }}>
                ストーンを投げる準備ができました
              </Typography>
            ) : null}
            {gamePhase === 'charging' ? (
              <Typography sx={{ fontWeight: 800, textAlign: 'center' }}>
                ボタンを離して投射
              </Typography>
            ) : null}
            {gamePhase === 'moving' ? (
              <Typography sx={{ fontWeight: 800, textAlign: 'center' }}>
                全ストーンの停止を待っています
              </Typography>
            ) : null}
            {showPowerButton ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <PowerShotButton
                  direction={powerDirection}
                  disabled={
                    !isSessionReady ||
                    initializationError !== null ||
                    onChargeStart === undefined ||
                    onChargeRelease === undefined ||
                    onChargeCancel === undefined
                  }
                  onChargeCancel={onChargeCancel ?? (() => undefined)}
                  onChargeRelease={onChargeRelease ?? (() => undefined)}
                  onChargeStart={onChargeStart ?? (() => undefined)}
                  power={displayedPower}
                />
              </Box>
            ) : null}
            {gamePhase === 'review' && !isFinalReview ? (
              <Button
                disabled={onNextShot === undefined}
                onClick={onNextShot}
                variant="contained"
              >
                次の投射へ
              </Button>
            ) : null}
            {isFinalReview ? (
              <Button
                disabled={onViewResult === undefined}
                onClick={onViewResult}
                variant="contained"
              >
                結果を見る
              </Button>
            ) : null}
            {canRetire ? (
              <Button
                color="error"
                onClick={onOpenRetireConfirmation}
                variant="outlined"
              >
                リタイア
              </Button>
            ) : null}
          </Stack>
        </Paper>
      </Box>
      <Dialog
        aria-describedby="retire-confirmation-description"
        aria-labelledby="retire-confirmation-title"
        onClose={onCloseRetireConfirmation}
        open={retireConfirmationOpen}
      >
        <DialogTitle id="retire-confirmation-title">
          ゲームをリタイアしますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="retire-confirmation-description">
            このゲームの投数とストーンは失われ、TOPへ戻ります。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseRetireConfirmation}>ゲームへ戻る</Button>
          <Button color="error" onClick={onConfirmRetire} variant="contained">
            リタイアする
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  )
}
