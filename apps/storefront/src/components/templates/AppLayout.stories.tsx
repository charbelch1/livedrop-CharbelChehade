import type { Meta, StoryObj } from '@storybook/react'
import { AppLayout } from './AppLayout'

const meta: Meta<typeof AppLayout> = {
  title: 'Templates/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta

export const Default: StoryObj<typeof AppLayout> = {
  render: (args) => (
    <AppLayout {...args}>
      <div className="bg-black border rounded p-6">Page content goes here.</div>
    </AppLayout>
  ),
}

