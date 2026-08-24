import { Box, ButtonBase, Typography } from '@mui/material'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type { PowerDirection } from '../game/types'

type ActiveInput =
  | { readonly kind: 'pointer'; readonly pointerId: number }
  | { readonly kind: 'keyboard'; readonly key: ' ' | 'Enter' }

interface PowerShotButtonProps {
  readonly disabled?: boolean
  readonly power: number | null
  readonly direction: PowerDirection | null
  readonly onChargeStart: () => void
  readonly onChargeRelease: () => void
  readonly onChargeCancel: () => void
}

function getMarkerPosition(power: number) {
  const progress = (power - 1) / 99
  const angle = Math.PI - progress * Math.PI

  return {
    x: 60 + Math.cos(angle) * 50,
    y: 65 - Math.sin(angle) * 50,
  }
}

function isPowerKey(key: string): key is ' ' | 'Enter' {
  return key === ' ' || key === 'Enter'
}

export function PowerShotButton({
  direction,
  disabled = false,
  onChargeCancel,
  onChargeRelease,
  onChargeStart,
  power,
}: PowerShotButtonProps) {
  const activeInputRef = useRef<ActiveInput | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const descriptionId = useId()
  const gradientId = `${descriptionId.replaceAll(':', '')}-power-gradient`
  const isCharging = power !== null && direction !== null
  const marker = useMemo(
    () => (power === null ? null : getMarkerPosition(power)),
    [power],
  )

  const cancelActiveInput = useCallback(() => {
    const activeInput = activeInputRef.current
    if (activeInput === null) {
      return
    }

    if (
      activeInput.kind === 'pointer' &&
      buttonRef.current?.hasPointerCapture(activeInput.pointerId)
    ) {
      buttonRef.current.releasePointerCapture(activeInput.pointerId)
    }
    activeInputRef.current = null
    onChargeCancel()
  }, [onChargeCancel])

  useEffect(() => {
    const handleWindowBlur = () => cancelActiveInput()
    window.addEventListener('blur', handleWindowBlur)
    return () => window.removeEventListener('blur', handleWindowBlur)
  }, [cancelActiveInput])

  useEffect(() => {
    if (disabled) {
      cancelActiveInput()
    }
  }, [cancelActiveInput, disabled])

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0 || activeInputRef.current !== null) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    activeInputRef.current = {
      kind: 'pointer',
      pointerId: event.pointerId,
    }
    onChargeStart()
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const activeInput = activeInputRef.current
    if (
      activeInput?.kind !== 'pointer' ||
      activeInput.pointerId !== event.pointerId
    ) {
      return
    }

    event.preventDefault()
    activeInputRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    onChargeRelease()
  }

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    const activeInput = activeInputRef.current
    if (
      activeInput?.kind === 'pointer' &&
      activeInput.pointerId === event.pointerId
    ) {
      cancelActiveInput()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      disabled ||
      !isPowerKey(event.key) ||
      event.repeat ||
      activeInputRef.current !== null
    ) {
      return
    }

    event.preventDefault()
    activeInputRef.current = { kind: 'keyboard', key: event.key }
    onChargeStart()
  }

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    const activeInput = activeInputRef.current
    if (
      !isPowerKey(event.key) ||
      activeInput?.kind !== 'keyboard' ||
      activeInput.key !== event.key
    ) {
      return
    }

    event.preventDefault()
    activeInputRef.current = null
    onChargeRelease()
  }

  const directionLabel =
    direction === 'increasing'
      ? '上昇中'
      : direction === 'decreasing'
        ? '下降中'
        : '未操作'

  return (
    <ButtonBase
      aria-describedby={descriptionId}
      aria-label="ストーンを投射"
      aria-pressed={isCharging}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onLostPointerCapture={handlePointerCancel}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      ref={buttonRef}
      type="button"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        border: '4px solid',
        borderColor: isCharging ? 'secondary.main' : 'primary.main',
        borderRadius: '50%',
        boxShadow: '0 7px 0 rgba(10, 72, 93, 0.32)',
        display: 'flex',
        flexDirection: 'column',
        height: { xs: 132, sm: 148 },
        justifyContent: 'flex-end',
        overflow: 'hidden',
        pb: 1.25,
        position: 'relative',
        touchAction: 'none',
        userSelect: 'none',
        width: { xs: 132, sm: 148 },
        '&:focus-visible': {
          outline: '4px solid',
          outlineColor: 'secondary.main',
          outlineOffset: 4,
        },
        '&.Mui-disabled': {
          opacity: 0.48,
        },
      }}
    >
      <Box
        aria-hidden="true"
        component="svg"
        viewBox="0 0 120 75"
        sx={{
          height: '62%',
          left: '50%',
          pointerEvents: 'none',
          position: 'absolute',
          top: 2,
          transform: 'translateX(-50%)',
          width: '90%',
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="52%" stopColor="#FBC02D" />
            <stop offset="100%" stopColor="#D32F2F" />
          </linearGradient>
        </defs>
        <path
          d="M 10 65 A 50 50 0 0 1 110 65"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth="9"
        />
        {marker ? (
          <circle
            cx={marker.x}
            cy={marker.y}
            fill="#ffffff"
            r="5"
            stroke="#153047"
            strokeWidth="3"
          />
        ) : null}
        <text fill="#153047" fontSize="10" fontWeight="800" x="5" y="74">
          1
        </text>
        <text
          fill="#153047"
          fontSize="10"
          fontWeight="800"
          textAnchor="end"
          x="117"
          y="74"
        >
          100
        </text>
      </Box>
      <Typography
        component="span"
        sx={{ fontSize: { xs: '1.55rem', sm: '1.8rem' }, fontWeight: 900 }}
      >
        {power ?? '—'} {direction === 'increasing' ? '↑' : direction === 'decreasing' ? '↓' : ''}
      </Typography>
      <Typography component="span" sx={{ fontSize: '0.72rem', fontWeight: 900 }}>
        長押しして離す
      </Typography>
      <Box component="span" id={descriptionId} sx={{ position: 'absolute', clip: 'rect(0 0 0 0)', width: 1, height: 1, overflow: 'hidden' }}>
        現在のPower {power ?? '未操作'}、{directionLabel}
      </Box>
    </ButtonBase>
  )
}
