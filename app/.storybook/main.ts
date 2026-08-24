import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../public'],
  addons: ['@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
}

export default config
