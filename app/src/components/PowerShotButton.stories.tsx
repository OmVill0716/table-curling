import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { PowerShotButton } from './PowerShotButton'

const meta = {
  title: 'Components/Power Shot Button',
  component: PowerShotButton,
  args: {
    direction: null,
    onChargeCancel: fn(),
    onChargeRelease: fn(),
    onChargeStart: fn(),
    power: null,
  },
} satisfies Meta<typeof PowerShotButton>

export default meta
type Story = StoryObj<typeof meta>

export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'ストーンを投射' })

    await expect(button).toHaveTextContent('—')
    await expect(button).toHaveTextContent('1')
    await expect(button).toHaveTextContent('100')
  },
}

export const PowerOne: Story = {
  args: { direction: 'increasing', power: 1 },
}

export const IncreasingFifty: Story = {
  args: { direction: 'increasing', power: 50 },
}

export const Maximum: Story = {
  args: { direction: 'decreasing', power: 100 },
}

export const DecreasingFifty: Story = {
  args: { direction: 'decreasing', power: 50 },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const PointerInput: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'ストーンを投射' })

    await userEvent.pointer([
      { keys: '[MouseLeft>]', target: button },
      { keys: '[/MouseLeft]', target: button },
    ])
    await expect(args.onChargeStart).toHaveBeenCalledOnce()
    await expect(args.onChargeRelease).toHaveBeenCalledOnce()
  },
}

export const KeyboardInput: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: 'ストーンを投射' })

    button.focus()
    await userEvent.keyboard(' ')
    await expect(args.onChargeStart).toHaveBeenCalledOnce()
    await expect(args.onChargeRelease).toHaveBeenCalledOnce()
  },
}
