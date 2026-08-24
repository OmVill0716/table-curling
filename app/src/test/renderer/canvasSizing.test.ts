import { describe, expect, it } from 'vitest'
import {
  fitCanvasCssSize,
  getCanvasViewport,
  normalizeCanvasPixelRatio,
  resizeCanvas,
} from '../../game/renderer/canvasSizing'

describe('Canvas sizing', () => {
  it('利用可能な幅と高さへ3:5で収める', () => {
    expect(fitCanvasCssSize(300, 800)).toEqual({ width: 300, height: 500 })
    expect(fitCanvasCssSize(900, 1000)).toEqual({ width: 600, height: 1000 })
  })

  it.each([
    [1, 1],
    [2, 2],
    [3, 2],
    [0, 1],
    [-1, 1],
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1],
    [undefined, 1],
  ])('DPR %sを%sへ正規化する', (input, expected) => {
    expect(normalizeCanvasPixelRatio(input)).toBe(expected)
  })

  it('CSS表示サイズとDPR反映後のbufferを分離する', () => {
    expect(getCanvasViewport(300, 500, 2)).toEqual({
      cssWidth: 300,
      cssHeight: 500,
      pixelRatio: 2,
      bufferWidth: 600,
      bufferHeight: 1000,
    })
  })

  it('CanvasのCSS表示サイズと内部bufferを更新する', () => {
    const canvas = {
      style: { width: '', height: '' },
      width: 0,
      height: 0,
    } as HTMLCanvasElement
    const viewport = getCanvasViewport(300, 500, 2)

    resizeCanvas(canvas, viewport)

    expect(canvas.style.width).toBe('300px')
    expect(canvas.style.height).toBe('500px')
    expect(canvas.width).toBe(600)
    expect(canvas.height).toBe(1000)
  })
})
