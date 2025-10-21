import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
}
export default meta

export const Primary: StoryObj<typeof Button> = {
  args: { children: 'Click me' },
}

