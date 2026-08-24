import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import {
  DEVELOPMENT_STATUS_TEXT,
  DevelopmentStatus,
} from './DevelopmentStatus'

const meta = {
  title: 'Development/Status',
  component: DevelopmentStatus,
} satisfies Meta<typeof DevelopmentStatus>

export default meta
type Story = StoryObj<typeof meta>

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('heading', { name: 'Table Curling' }),
    ).toBeVisible()
    await expect(canvas.getByText(DEVELOPMENT_STATUS_TEXT)).toBeVisible()
  },
}
