import type { Meta, StoryObj } from '@storybook/react'
import { ProductCard } from './ProductCard'

const meta: Meta<typeof ProductCard> = {
  title: 'Molecules/ProductCard',
  component: ProductCard,
  args: {
    id: 'sku-001',
    title: 'Aero Water Bottle',
    price: 14.99,
    image: '/logo.svg',
  },
}

export default meta

type Story = StoryObj<typeof ProductCard>

export const Default: Story = {
  args: {
    onAdd: () => alert('Add to cart'),
  },
}

