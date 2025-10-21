import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  args: { placeholder: 'Search products' },
}

export default meta

export const Default: StoryObj<typeof Input> = {}

export const WithValue: StoryObj<typeof Input> = {
  args: { defaultValue: 'Trail running' },
}

