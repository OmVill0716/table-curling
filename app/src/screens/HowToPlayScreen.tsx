import { Box, Paper, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { AppShell } from '../components/AppShell'
import { ScreenHeader } from '../components/ScreenHeader'

interface HowToPlayScreenProps {
  readonly onBack: () => void
}

interface RuleSectionProps {
  readonly children: ReactNode
  readonly number: string
  readonly title: string
}

function RuleSection({ children, number, title }: RuleSectionProps) {
  return (
    <Paper component="section" elevation={2} sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Box
          aria-hidden="true"
          sx={{
            alignItems: 'center',
            bgcolor: 'primary.main',
            borderRadius: '50%',
            color: 'primary.contrastText',
            display: 'flex',
            flex: '0 0 auto',
            fontWeight: 900,
            height: 36,
            justifyContent: 'center',
            width: 36,
          }}
        >
          {number}
        </Box>
        <Stack spacing={1}>
          <Typography component="h2" sx={{ fontWeight: 900 }} variant="h6">
            {title}
          </Typography>
          <Typography color="text.secondary" component="div">
            {children}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  )
}

export function HowToPlayScreen({ onBack }: HowToPlayScreenProps) {
  return (
    <AppShell>
      <Stack spacing={3}>
        <ScreenHeader backLabel="TOPへ" onBack={onBack} title="遊び方" />

        <Paper
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            p: { xs: 2.5, sm: 3 },
            textAlign: 'center',
          }}
        >
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800 }}>
            円形ターゲットへストーンを滑らせ、5投の合計得点を競います。
          </Typography>
        </Paper>

        <RuleSection number="1" title="フィールドと長さを選ぶ">
          ICE、WOOD、FELTでは滑りやすさが異なります。SHORT、MEDIUM、LONGでは投射位置が変わります。
        </RuleSection>

        <RuleSection number="2" title="Powerを決めて投げる">
          円形ボタンを長押しすると、Powerが1から100まで往復します。狙った強さで離すと投射します。方向はターゲット中心へ固定です。
        </RuleSection>

        <RuleSection number="3" title="ストーンの動きを読む">
          ストーン同士は衝突して互いに動きます。ストーン全体が盤面の四辺から出るとコースアウトです。
        </RuleSection>

        <RuleSection number="4" title="得点を狙う">
          ターゲットの100、50、30、10は固定配点です。ストーンの色は、現在いる得点帯の色へ動的に変わります。色だけでなくターゲットの数字でも確認できます。
        </RuleSection>

        <RuleSection number="5" title="5投を完了する">
          1〜4投目は全ストーン停止後に「次の投射へ」で進みます。5投目は「結果を見る」でResultへ進み、各ストーンの確定得点と合計得点を確認します。
        </RuleSection>

        <RuleSection number="6" title="途中で終了するとき">
          リタイアすると未完了ゲームを保存せずTOPへ戻ります。タブを閉じるか再読み込みした場合も、途中のゲーム記録は失われます。
        </RuleSection>

        <RuleSection number="7" title="効果音設定">
          効果音はTOPでON/OFFを切り替えられます。
        </RuleSection>

        <Paper sx={{ p: 2.5 }} variant="outlined">
          <Typography color="text.secondary" variant="body2">
            このゲームでは、Power Gaugeとストーン、衝突、Cameraがゲーム進行に合わせて動きます。
          </Typography>
        </Paper>
      </Stack>
    </AppShell>
  )
}
