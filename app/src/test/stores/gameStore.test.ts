import { describe, expect, it } from 'vitest'
import type { GameResult } from '../../game/types'
import { createGameStore } from '../../stores/gameStore'

const result: GameResult = {
  stones: [
    {
      id: 'stone-1',
      position: { x: 300, y: 300 },
      inPlay: true,
      score: 100,
    },
  ],
  totalScore: 100,
  highScoreRank: 1,
}

function startGame() {
  const store = createGameStore()
  const actions = store.getState()
  actions.openGameSetup()
  actions.selectSurface('WOOD')
  actions.selectThrowDistance('LONG')
  actions.startGame()
  return store
}

describe('gameStore', () => {
  it('仕様どおりの初期状態を生成する', () => {
    const state = createGameStore().getState()

    expect(state.screen).toBe('top')
    expect(state.surface).toBeNull()
    expect(state.throwDistance).toBeNull()
    expect(state.gamePhase).toBeNull()
    expect(state.completedShots).toBe(0)
    expect(state.maxShots).toBe(5)
    expect(state.result).toBeNull()
    expect(state.soundEnabled).toBe(true)
  })

  it('TOPからゲーム設定、スコア確認、遊び方へ移動する', () => {
    const store = createGameStore()

    store.getState().openGameSetup()
    expect(store.getState().screen).toBe('fieldSelect')

    store.getState().returnToTop()
    store.getState().openScore()
    expect(store.getState().screen).toBe('score')

    store.getState().returnToTop()
    store.getState().openHowToPlay()
    expect(store.getState().screen).toBe('howToPlay')
  })

  it('Surfaceと距離を選択してGameを開始する', () => {
    const store = startGame()
    const state = store.getState()

    expect(state.screen).toBe('game')
    expect(state.surface).toBe('WOOD')
    expect(state.throwDistance).toBe('LONG')
    expect(state.gamePhase).toBe('ready')
  })

  it('設定中に1画面戻っても選択値を維持する', () => {
    const store = createGameStore()
    store.getState().openGameSetup()
    store.getState().selectSurface('ICE')
    store.getState().selectThrowDistance('MEDIUM')

    store.getState().backFromSetup()
    expect(store.getState()).toMatchObject({
      screen: 'lengthSelect',
      surface: 'ICE',
      throwDistance: 'MEDIUM',
    })

    store.getState().backFromSetup()
    expect(store.getState()).toMatchObject({
      screen: 'fieldSelect',
      surface: 'ICE',
      throwDistance: 'MEDIUM',
    })

    store.getState().backFromSetup()
    expect(store.getState()).toMatchObject({
      screen: 'top',
      surface: 'ICE',
      throwDistance: 'MEDIUM',
    })
  })

  it('Surface未選択では距離選択へ進まない', () => {
    const store = createGameStore({ screen: 'lengthSelect' })

    store.getState().selectThrowDistance('SHORT')

    expect(store.getState()).toMatchObject({
      screen: 'lengthSelect',
      throwDistance: null,
    })
  })

  it('選択内容確認以外または選択不足ではGameを開始しない', () => {
    const wrongScreen = createGameStore({
      screen: 'lengthSelect',
      surface: 'ICE',
      throwDistance: 'SHORT',
    })
    const missingDistance = createGameStore({
      screen: 'selectionConfirm',
      surface: 'ICE',
    })

    wrongScreen.getState().startGame()
    missingDistance.getState().startGame()

    expect(wrongScreen.getState().screen).toBe('lengthSelect')
    expect(missingDistance.getState().screen).toBe('selectionConfirm')
  })

  it('Gameから確定Resultへ移りgamePhaseを解除する', () => {
    const store = startGame()

    store.getState().showResult(result)

    expect(store.getState()).toMatchObject({
      screen: 'result',
      gamePhase: null,
      completedShots: 5,
      result,
    })
  })

  it('Game以外からResultへ移らない', () => {
    const store = createGameStore({
      screen: 'top',
      surface: 'ICE',
      throwDistance: 'SHORT',
    })

    store.getState().showResult(result)

    expect(store.getState().screen).toBe('top')
    expect(store.getState().result).toBeNull()
  })

  it('Retryで選択値を維持してGame状態を初期化する', () => {
    const store = startGame()
    store.getState().showResult(result)

    store.getState().retryGame()

    expect(store.getState()).toMatchObject({
      screen: 'game',
      surface: 'WOOD',
      throwDistance: 'LONG',
      gamePhase: 'ready',
      completedShots: 0,
      result: null,
    })
  })

  it('ResultのTOPで選択値とゲーム状態を解除する', () => {
    const store = startGame()
    store.getState().showResult(result)

    store.getState().leaveResultForTop()

    expect(store.getState()).toMatchObject({
      screen: 'top',
      surface: null,
      throwDistance: null,
      gamePhase: null,
      completedShots: 0,
      result: null,
    })
  })

  it('Game以外へ移動するとgamePhaseをnullにする', () => {
    const scoreStore = createGameStore({
      screen: 'game',
      gamePhase: 'review',
    })
    const howToStore = createGameStore({
      screen: 'game',
      gamePhase: 'moving',
    })
    const topStore = createGameStore({
      screen: 'game',
      gamePhase: 'ready',
    })

    scoreStore.getState().openScore()
    howToStore.getState().openHowToPlay()
    topStore.getState().returnToTop()

    expect(scoreStore.getState().gamePhase).toBeNull()
    expect(howToStore.getState().gamePhase).toBeNull()
    expect(topStore.getState().gamePhase).toBeNull()
  })

  it('効果音設定だけを切り替える', () => {
    const store = createGameStore({
      screen: 'selectionConfirm',
      surface: 'FELT',
      throwDistance: 'SHORT',
    })

    store.getState().setSoundEnabled(false)

    expect(store.getState()).toMatchObject({
      screen: 'selectionConfirm',
      surface: 'FELT',
      throwDistance: 'SHORT',
      soundEnabled: false,
    })
  })

  it('Store instance同士で状態を共有しない', () => {
    const first = createGameStore()
    const second = createGameStore()

    first.getState().openScore()
    first.getState().setSoundEnabled(false)

    expect(second.getState()).toMatchObject({
      screen: 'top',
      soundEnabled: true,
    })
  })

  it('Reset actionを公開しない', () => {
    expect(createGameStore().getState()).not.toHaveProperty('reset')
  })
})
