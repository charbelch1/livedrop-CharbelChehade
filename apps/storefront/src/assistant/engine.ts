type Answer = { text: string }

function apiBase() {
  const w: any = typeof window !== 'undefined' ? (window as any) : {}
  return w.__API_BASE__ || (import.meta as any)?.env?.VITE_API_BASE_URL || ''
}

export async function askSupport(query: string, email?: string): Promise<Answer> {
  // Always use the backend assistant so it can apply prompts.yaml
  try {
    const base = apiBase()
    const url = `${base ? base.replace(/\/$/, '') : ''}/api/assistant/message`
    const payload: any = { message: query }
    if (email) payload.email = email
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('bad_response')
    const data: any = await res.json()
    if (typeof data?.reply === 'string') return { text: data.reply }
  } catch {}
  // Fallback if API unavailable
  return { text: "Sorry, I can't help with that right now. Please try again in a moment." }
}
