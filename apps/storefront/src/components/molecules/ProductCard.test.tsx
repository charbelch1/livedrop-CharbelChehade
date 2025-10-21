import '@testing-library/jest-dom'
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductCard } from './ProductCard'

describe('ProductCard', () => {
  const base = {
    id: 'sku-001',
    title: 'Aero Water Bottle',
    price: 14.99,
    image: '/logo.svg',
  }

  it('renders product info and link', () => {
    render(<ProductCard {...base} onAdd={() => {}} />)
    const title = screen.getByText(/aero water bottle/i)
    expect(title).toBeInTheDocument()
    const titleLink = title.closest('a')
    expect(titleLink).toHaveAttribute('href', expect.stringContaining('#/p/sku-001'))
    // Price is formatted somewhere else but visible as currency-like string
    expect(screen.getByText(/\$/)).toBeInTheDocument()
  })

  it('calls onAdd when button clicked', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<ProductCard {...base} onAdd={onAdd} />)
    const btn = screen.getByRole('button', { name: /add aero water bottle to cart/i })
    await user.click(btn)
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
