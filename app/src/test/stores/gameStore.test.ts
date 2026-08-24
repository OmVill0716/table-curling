import { describe, expect, it } from 'vitest'
import type { GameResult, PhysicsSnapshot } from '../../game/types'
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

const snapshot: PhysicsSnapshot = {
  elapsedMs: 250,
  stepCount: 30,
  isComplete: true,
  stones: [
    {
      id: 'stone-1',
      position: { x: 300, y: 300 },
      velocity: { x: 0, y: 0 },
      speed: 0,
      angularVelocity: 0,
      motionState: 'stopped',
    },
  ],
}

const initialPower = { value: 1, direction: 'increasing' } as const

function startGame() {
  const store = createGameStore()
  const actions = store.getState()
  actions.openGameSetup()
  actions.selectSurface('WOOD')
  actions.selectThrowDistance('LONG')
  actions.startGame()
  return store
}

function startMoving(store: ReturnType<typeof startGame>) {
  store.getState().startCharging(initialPower)
  store.getState().launchStarted()
}

function finishGame(store: ReturnType<typeof startGame>) {
  for (let shot = 1; shot <= 5; shot += 1) {
    startMoving(store)
    store.getState().completeShot(snapshot, shot === 5 ? result : undefined)
    if (shot < 5) {
      store.getState().prepareNextShot()
    }
  }
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
    expect(state.displayedPower).toBeNull()
    expect(state.powerDirection).toBeNull()
    expect(state.settledStones).toEqual([])
    expect(state.result).toBeNull()
    expect(state.retireConfirmationOpen).toBe(false)
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

  it('readyからcharging、moving、reviewへ遷移する', () => {
    const store = startGame()

    store.getState().startCharging(initialPower)
    expect(store.getState()).toMatchObject({
      gamePhase: 'charging',
      displayedPower: 1,
      powerDirection: 'increasing',
    })

    store
      .getState()
      .updateDisplayedPower({ value: 50, direction: 'increasing' })
    expect(store.getState().displayedPower).toBe(50)

    store.getState().launchStarted()
    expect(store.getState()).toMatchObject({
      gamePhase: 'moving',
      displayedPower: null,
      powerDirection: null,
    })

    store.getState().completeShot(snapshot)
    expect(store.getState()).toMatchObject({
      gamePhase: 'review',
      completedShots: 1,
      settledStones: snapshot.stones,
    })
  })

  it('1〜4投目は次の投射操作までreviewに留まる', () => {
    const store = startGame()
    startMoving(store)
    store.getState().completeShot(snapshot)

    store.getState().startCharging(initialPower)
    expect(store.getState().gamePhase).toBe('review')

    store.getState().prepareNextShot()
    expect(store.getState().gamePhase).toBe('ready')
  })

  it('movingとreviewでは追加投射を拒否する', () => {
    const store = startGame()
    startMoving(store)

    store.getState().startCharging(initialPower)
    expect(store.getState().gamePhase).toBe('moving')

    store.getState().completeShot(snapshot)
    store.getState().startCharging(initialPower)
    expect(store.getState().gamePhase).toBe('review')
  })

  it('5投目停止時にResultを一度だけ確定する', () => {
    const store = startGame()
    finishGame(store)

    expect(store.getState()).toMatchObject({
      screen: 'game',
      gamePhase: 'review',
      completedShots: 5,
      result,
    })

    const replacement = { ...result, totalScore: 0 }
    store.getState().completeShot(snapshot, replacement)
    expect(store.getState().result).toBe(result)
  })

  it('5投目より前のResultと5投目のResult不足を拒否する', () => {
    const early = startGame()
    startMoving(early)
    early.getState().completeShot(snapshot, result)
    expect(early.getState()).toMatchObject({
      gamePhase: 'moving',
      completedShots: 0,
      result: null,
    })

    const missing = startGame()
    for (let shot = 1; shot <= 4; shot += 1) {
      startMoving(missing)
      missing.getState().completeShot(snapshot)
      missing.getState().prepareNextShot()
    }
    startMoving(missing)
    missing.getState().completeShot(snapshot)
    expect(missing.getState()).toMatchObject({
      gamePhase: 'moving',
      completedShots: 4,
      result: null,
    })
  })

  it('結果を見るで確定済みResultへ移りgamePhaseを解除する', () => {
    const store = startGame()
    finishGame(store)

    store.getState().viewResult()

    expect(store.getState()).toMatchObject({
      screen: 'result',
      gamePhase: null,
      completedShots: 5,
      result,
    })
  })

  it('最終review以外からResultへ移らない', () => {
    const store = createGameStore({
      screen: 'top',
      surface: 'ICE',
      throwDistance: 'SHORT',
    })

    store.getState().viewResult()

    expect(store.getState().screen).toBe('top')
    expect(store.getState().result).toBeNull()
  })

  it('Retryで選択値を維持してGame状態を初期化する', () => {
    const store = startGame()
    finishGame(store)
    store.getState().viewResult()

    store.getState().retryGame()

    expect(store.getState()).toMatchObject({
      screen: 'game',
      surface: 'WOOD',
      throwDistance: 'LONG',
      gamePhase: 'ready',
      completedShots: 0,
      displayedPower: null,
      settledStones: [],
      result: null,
    })
  })

  it('ResultのTOPで選択値とゲーム状態を解除する', () => {
    const store = startGame()
    finishGame(store)
    store.getState().viewResult()

    store.getState().leaveResultForTop()

    expect(store.getState()).toMatchObject({
      screen: 'top',
      surface: null,
      throwDistance: null,
      gamePhase: null,
      completedShots: 0,
      settledStones: [],
      result: null,
    })
  })

  it.each(['ready', 'moving', 'review'] as const)(
    '%sのリタイア確認を取り消すと元のphaseへ戻る',
    (gamePhase) => {
      const store = createGameStore({
        screen: 'game',
        surface: 'ICE',
        throwDistance: 'SHORT',
        gamePhase,
        completedShots: gamePhase === 'review' ? 1 : 0,
      })

      store.getState().openRetireConfirmation()
      expect(store.getState().retireConfirmationOpen).toBe(true)
      store.getState().closeRetireConfirmation()

      expect(store.getState()).toMatchObject({
        gamePhase,
        retireConfirmationOpen: false,
        resumePhaseAfterRetire: null,
      })
    },
  )

  it('chargingのリタイア確認では充電を破棄してreadyへ戻る', () => {
    const store = startGame()
    store.getState().startCharging({ value: 70, direction: 'decreasing' })

    store.getState().openRetireConfirmation()
    store.getState().closeRetireConfirmation()

    expect(store.getState()).toMatchObject({
      gamePhase: 'ready',
      displayedPower: null,
      powerDirection: null,
      retireConfirmationOpen: false,
    })
  })

  it('リタイア確定で途中状態を破棄してResultを経由せずTOPへ戻る', () => {
    const store = startGame()
    startMoving(store)
    store.getState().completeShot(snapshot)
    store.getState().openRetireConfirmation()

    store.getState().confirmRetire()

    expect(store.getState()).toMatchObject({
      screen: 'top',
      gamePhase: null,
      completedShots: 0,
      settledStones: [],
      result: null,
      retireConfirmationOpen: false,
    })
  })

  it('5投目停止後はリタイア確認を開かない', () => {
    const store = startGame()
    finishGame(store)

    store.getState().openRetireConfirmation()

    expect(store.getState().retireConfirmationOpen).toBe(false)
  })

  it('ページ非表示時はchargingだけをreadyへ戻す', () => {
    const charging = startGame()
    charging.getState().startCharging({ value: 25, direction: 'increasing' })
    charging.getState().handlePageHidden()
    expect(charging.getState()).toMatchObject({
      gamePhase: 'ready',
      displayedPower: null,
    })

    for (const phase of ['ready', 'moving', 'review'] as const) {
      const store = createGameStore({
        screen: 'game',
        gamePhase: phase,
      })
      store.getState().handlePageHidden()
      expect(store.getState().gamePhase).toBe(phase)
    }
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
