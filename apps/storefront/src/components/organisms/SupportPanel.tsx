import React, { useEffect, useRef, useState } from 'react'
import { askSupport } from '../../assistant/engine'
import { useUser } from '../../lib/user'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'

export const SupportPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [a, setA] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const customer = useUser(s => s.customer)

  useEffect(() => { if (open) firstRef.current?.focus() }, [open])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Basic focus containment when open
  useEffect(() => {
    function onFocus(e: FocusEvent) {
      if (!open) return
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        e.stopPropagation(); panelRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus()
      }
    }
    document.addEventListener('focusin', onFocus)
    return () => document.removeEventListener('focusin', onFocus)
  }, [open])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSlow(false)
    setA('Replying, wait a moment please.')
    const slowTimer = setTimeout(() => setSlow(true), 1500)
    try {
      const res = await askSupport(q, customer?.email || undefined)
      setA(res.text)
    } finally {
      clearTimeout(slowTimer)
      setLoading(false)
    }
  }

  return (
    <>
      <button
        className="group fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-indigo-600 text-white px-4 py-3 shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Open support chat"
        title="Ask Support"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z" />
        </svg>
        <span className="hidden sm:block font-medium">Ask Support</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-20" role="dialog" aria-modal="true" aria-label="Ask Support Panel">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)}></div>
          <div className="absolute inset-0 grid place-items-center p-4">
            <div ref={panelRef} className="w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg text-zinc-900">Ask Support</h2>
                <button className="text-zinc-500 hover:text-zinc-700" onClick={() => setOpen(false)} aria-label="Close support">X</button>
              </div>
              <form onSubmit={onSubmit} className="flex gap-2 items-center">
                <Input ref={firstRef as any} value={q} onChange={e => setQ(e.target.value)} placeholder="Type your question or order id" aria-label="Support question" disabled={loading} />
                <Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send'}</Button>
              </form>
              <div className="text-sm text-zinc-800 whitespace-pre-wrap bg-zinc-50 border border-zinc-200 rounded-lg p-3 min-h-[6rem]" aria-live="polite">
                {a}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
