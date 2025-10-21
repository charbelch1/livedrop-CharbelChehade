import React, { useState } from 'react'

type Props = { email?: string }

export default function SupportAssistant({ email }: Props) {
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const [loading, setLoading] = useState(false)
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL

  async function ask() {
    if (!API_BASE) { setA('API not configured.'); return }
    setLoading(true); setA('')
    const res = await fetch(`${API_BASE}/api/assistant/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, email })
    })
    const data = await res.json()
    setA(data.reply || 'No reply')
    setLoading(false)
  }

  return (
    <div className="p-3 border rounded">
      <div className="font-medium mb-2">Ask Support</div>
      <textarea className="w-full border rounded p-2" rows={3} value={q} onChange={e => setQ(e.target.value)} placeholder="Type your question..." />
      <div className="mt-2 flex justify-end">
        <button className="bg-black text-white px-3 py-1 rounded" onClick={ask} disabled={loading || !q}>{loading ? 'Asking...' : 'Ask'}</button>
      </div>
      {a && <div className="mt-3 text-sm whitespace-pre-wrap">{a}</div>}
    </div>
  )
}

