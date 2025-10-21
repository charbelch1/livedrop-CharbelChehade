import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { askSupport } from './engine'

describe('Ask Support', () => {
  const g: any = globalThis as any
  let origFetch: any

  beforeEach(() => { origFetch = g.fetch })
  afterEach(() => { g.fetch = origFetch })

  it('answers known policy with citation', async () => {
    g.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ intent: 'policy_question', reply: 'Account details... [Account1.1]' }) }))
    const res = await askSupport('How do I create a Shoplite account and verify my email?')
    expect(res.text).toMatch(/\[Account1\.1\]/)
  })

  it('refuses out-of-scope', async () => {
    g.fetch = vi.fn(async () => ({ ok: false, json: async () => ({}) }))
    const res = await askSupport('Tell me about quantum physics')
    expect(res.text.toLowerCase()).toMatch(/sorry/i)
  })

  it('includes order status and citation (via assistant API)', async () => {
    g.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ intent: 'order_status', reply: 'Order ****GHIJ status: Shipped. Carrier: UPS. ETA: 3 days. [Order1.1]' }) }))
    const res = await askSupport('Where is my order ABCDEFGHIJ?')
    expect(res.text).toMatch(/Shipped/)
    expect(res.text).toMatch(/\[Order1\.1\]/)
  })
})
