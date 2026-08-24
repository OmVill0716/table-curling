import { Button, CssBaseline, Paper, Stack, ThemeProvider, Typography } from '@mui/material'
import { AppShell } from './components/AppShell'
import { createEmptyHighScores } from './config/highScores'
import { FieldSelectScreen } from './screens/FieldSelectScreen'
import { GameSession } from './screens/GameSession'
import { HowToPlayScreen } from './screens/HowToPlayScreen'
import { LengthSelectScreen } from './screens/LengthSelectScreen'
import { ResultScreen } from './screens/ResultScreen'
import { ScoreScreen } from './screens/ScoreScreen'
import { SelectionConfirmScreen } from './screens/SelectionConfirmScreen'
import { TopScreen } from './screens/TopScreen'
import { GameStoreProvider } from './stores/GameStoreProvider'
import { useGameStore } from './stores/useGameStore'
import { appTheme } from './theme'

const emptyHighScores = createEmptyHighScores()

function InvalidStateScreen({ onTop }: { readonly onTop: () => void }) {
  return (
    <AppShell maxWidth={560}>
      <Stack sx={{ justifyContent: 'center', minHeight: 'calc(100svh - 32px)' }}>
        <Paper elevation={4} sx={{ p: 4, textAlign: 'center' }}>
          <Stack spacing={2}>
            <Typography component="h1" variant="h5">
              ゲーム状態を確認できませんでした
            </Typography>
            <Typography color="text.secondary">
              TOPへ戻って、フィールドと長さを選び直してください。
            </Typography>
            <Button onClick={onTop} variant="contained">
              TOPへ
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </AppShell>
  )
}

function assertNever(screen: never): never {
  throw new Error(`Unknown screen: ${String(screen)}`)
}

export function AppContent() {
  const screen = useGameStore((store) => store.screen)
  const surface = useGameStore((store) => store.surface)
  const throwDistance = useGameStore((store) => store.throwDistance)
  const gamePhase = useGameStore((store) => store.gamePhase)
  const result = useGameStore((store) => store.result)
  const soundEnabled = useGameStore((store) => store.soundEnabled)
  const openGameSetup = useGameStore((store) => store.openGameSetup)
  const openScore = useGameStore((store) => store.openScore)
  const openHowToPlay = useGameStore((store) => store.openHowToPlay)
  const selectSurface = useGameStore((store) => store.selectSurface)
  const selectThrowDistance = useGameStore(
    (store) => store.selectThrowDistance,
  )
  const backFromSetup = useGameStore((store) => store.backFromSetup)
  const startGame = useGameStore((store) => store.startGame)
  const retryGame = useGameStore((store) => store.retryGame)
  const leaveResultForTop = useGameStore((store) => store.leaveResultForTop)
  const returnToTop = useGameStore((store) => store.returnToTop)
  const setSoundEnabled = useGameStore((store) => store.setSoundEnabled)

  switch (screen) {
    case 'top':
      return (
        <TopScreen
          onOpenHowToPlay={openHowToPlay}
          onOpenScore={openScore}
          onSoundEnabledChange={setSoundEnabled}
          onStartGame={openGameSetup}
          soundEnabled={soundEnabled}
        />
      )
    case 'fieldSelect':
      return (
        <FieldSelectScreen
          onBack={backFromSetup}
          onSelect={selectSurface}
          selectedSurface={surface}
        />
      )
    case 'lengthSelect':
      return (
        <LengthSelectScreen
          onBack={backFromSetup}
          onSelect={selectThrowDistance}
          selectedDistance={throwDistance}
        />
      )
    case 'selectionConfirm':
      if (surface === null || throwDistance === null) {
        return <InvalidStateScreen onTop={returnToTop} />
      }
      return (
        <SelectionConfirmScreen
          onBack={backFromSetup}
          onStartGame={startGame}
          surface={surface}
          throwDistance={throwDistance}
        />
      )
    case 'game':
      if (surface === null || throwDistance === null || gamePhase === null) {
        return <InvalidStateScreen onTop={returnToTop} />
      }
      return <GameSession surface={surface} throwDistance={throwDistance} />
    case 'result':
      if (surface === null || throwDistance === null || result === null) {
        return <InvalidStateScreen onTop={returnToTop} />
      }
      return (
        <ResultScreen
          onRetry={retryGame}
          onTop={leaveResultForTop}
          result={result}
          surface={surface}
          throwDistance={throwDistance}
        />
      )
    case 'score':
      return <ScoreScreen highScores={emptyHighScores} onBack={returnToTop} />
    case 'howToPlay':
      return <HowToPlayScreen onBack={returnToTop} />
    default:
      return assertNever(screen satisfies never)
  }
}

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <GameStoreProvider>
        <AppContent />
      </GameStoreProvider>
    </ThemeProvider>
  )
}

export default App
