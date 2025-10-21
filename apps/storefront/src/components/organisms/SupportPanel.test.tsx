import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SupportPanel } from './SupportPanel'

vi.mock('../../assistant/engine', () => ({
  askSupport: vi.fn(async (q: string) => ({ text: `Echo: ${q} [Account1.1]` })),
}))

describe('SupportPanel', () => {
  it('opens and focuses the input, submits and shows answer', async () => {
    const user = userEvent.setup()
    render(<SupportPanel />)

    const openBtn = screen.getByRole('button', { name: /ask support/i })
    await user.click(openBtn)

    const input = await screen.findByRole('textbox', { name: /support question/i })
    await waitFor(() => expect(document.activeElement).toBe(input))

    await user.type(input, 'Where is my order ABCDEFGHIJ?')
    await user.click(screen.getByRole('button', { name: /send/i }))

    await screen.findByText(/echo: where is my order/i)
    expect(screen.getByText(/\[Account1\.1\]/)).toBeInTheDocument()
  })
})

