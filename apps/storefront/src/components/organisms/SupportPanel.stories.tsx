import type { Meta, StoryObj } from '@storybook/react'
import { SupportPanel } from './SupportPanel'

const meta: Meta<typeof SupportPanel> = {
  title: 'Organisms/SupportPanel',
  component: SupportPanel,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

export const Default: StoryObj<typeof SupportPanel> = {}

