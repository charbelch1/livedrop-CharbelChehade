import React, { useState } from 'react'

type Props = { onIdentified: (customer: any) => void }

export default function UserLogin({ onIdentified }: Props) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL

  async function lookup() {
    setLoading(true); setError(null)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000) // 10s safety timeout
    try {
      const base = (API_BASE || '').replace(/\/$/, '')
      const url = `${base}/api/customers?email=${encodeURIComponent(email)}`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) {
        // Provide clearer message based on status
        if (res.status === 404) throw new Error('CUSTOMER_NOT_FOUND')
        throw new Error(`HTTP_${res.status}`)
      }
      const customer = await res.json()
      onIdentified(customer)
    } catch (err: any) {
      if (err?.name === 'AbortError') setError('API unreachable (timeout). Please try again.')
      else if (err?.message === 'CUSTOMER_NOT_FOUND') setError('Customer not found')
      else setError('Unable to reach API. Check your connection and try again.')
    } finally {
      clearTimeout(timer)
      setLoading(false)
    }
  }

  if (!API_BASE) return <div className="p-3 text-sm text-amber-700">Set VITE_API_BASE_URL to enable login.</div>

  return (
    <div className="flex items-center gap-2">
      <input
        aria-label="Email"
        className="border border-zinc-300 rounded-lg px-3 py-2 text-sm shadow-sm"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow-sm disabled:opacity-50" onClick={lookup} disabled={loading || !email}>
        {loading ? 'Checking...' : 'Continue'}
      </button>
      {error && <span className="text-red-600 text-sm">{error}</span>}
    </div>
  )
}
