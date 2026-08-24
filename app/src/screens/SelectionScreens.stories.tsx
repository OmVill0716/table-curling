import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { FieldSelectScreen } from './FieldSelectScreen'
import { LengthSelectScreen } from './LengthSelectScreen'
import { SelectionConfirmScreen } from './SelectionConfirmScreen'

const meta = {
  title: 'Screens/Game Setup',
  parameters: { appScreen: true },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const FieldSelect: Story = {
  render: () => (
    <FieldSelectScreen
      onBack={fn()}
      onSelect={fn()}
      selectedSurface="WOOD"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: 'フィールド選択' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'WOODを選択' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const LengthSelect: Story = {
  render: () => (
    <LengthSelectScreen
      onBack={fn()}
      onSelect={fn()}
      selectedDistance="LONG"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: '長さ選択' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'LONGを選択' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}

export const SelectionConfirm: Story = {
  render: () => (
    <SelectionConfirmScreen
      onBack={fn()}
      onStartGame={fn()}
      surface="FELT"
      throwDistance="MEDIUM"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { name: '選択内容確認' }),
    ).toBeVisible()
    await expect(canvas.getByText('FELT')).toBeVisible()
    await expect(canvas.getByText('MEDIUM')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'ゲーム開始' }))
  },
}
