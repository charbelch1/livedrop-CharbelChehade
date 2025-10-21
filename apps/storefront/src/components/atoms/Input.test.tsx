import '@testing-library/jest-dom'
import React, { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

describe('Input', () => {
  it('renders with placeholder and accepts typing', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Search" aria-label="search" />)
    const el = screen.getByRole('textbox', { name: /search/i })
    expect(el).toBeInTheDocument()
    await user.type(el, 'abc')
    expect(el).toHaveValue('abc')
  })

  it('forwards ref correctly', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} aria-label="ref" />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})

