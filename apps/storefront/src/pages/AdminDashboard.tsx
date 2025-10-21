import React, { useEffect, useMemo, useState } from 'react'

type Business = { revenue: number; orders: number; customers: number; avgOrderValue: number; ordersByStatus?: Record<string, number> }
type Perf = { sseConnections: number; requestCount: number; failedRequests?: number; avgLatencyMs?: number; uptimeSeconds: number; db?: { ok: boolean }; llm?: { configured: boolean; online: boolean; backoffUntil: number } }
type Assistant = { queries?: number; intents: Record<string, number>; functionCalls: Record<string, number>; avgResponseMsByIntent?: Record<string, { count: number; avgMs: number }>; llmLatencyByIntent?: Record<string, { count: number; avgMs: number }> }

type Point = { date: string; revenue: number }

function usePolling<T>(fn: () => Promise<T>, deps: any[], interval = 5000) {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let alive = true
    let timer: any
    async function tick() {
      try { const v = await fn(); if (alive) setData(v) } catch {}
      if (alive) timer = setTimeout(tick, interval)
    }
    tick()
    return () => { alive = false; if (timer) clearTimeout(timer) }
  }, deps)
  return data
}

function format(n?: number) { return typeof n === 'number' ? n.toLocaleString() : '-' }

function MiniSparkline({ points }: { points: Point[] }) {
  const width = 240, height = 60, pad = 6
  const xs = points.map((_, i) => i)
  const ys = points.map(p => p.revenue)
  const minY = Math.min(...ys, 0)
  const maxY = Math.max(...ys, 1)
  const path = points.map((p, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * (width - pad * 2)
    const y = height - pad - ((p.revenue - minY) / Math.max(1, maxY - minY)) * (height - pad * 2)
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={width} height={height} className="bg-white rounded border border-gray-200">
      <path d={path} fill="none" stroke="#06b6d4" strokeWidth={2} />
    </svg>
  )
}

export default function AdminDashboard() {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL
  const [business, setBusiness] = useState<Business | null>(null)
  const [perf, setPerf] = useState<Perf | null>(null)
  const [assistant, setAssistant] = useState<Assistant | null>(null)
  const [revenuePoints, setRevenuePoints] = useState<Point[]>([])

  // Poll dashboard endpoints
  useEffect(() => {
    if (!API_BASE) return
    let alive = true
    async function load() {
      try {
        const [b, p, a] = await Promise.all([
          fetch(`${API_BASE}/api/dashboard/business-metrics`).then(r => r.json()),
          fetch(`${API_BASE}/api/dashboard/performance`).then(r => r.json()),
          fetch(`${API_BASE}/api/dashboard/assistant-stats`).then(r => r.json()),
        ])
        if (alive) { setBusiness(b); setPerf(p); setAssistant(a) }
      } catch {}
    }
    load()
    const t = setInterval(load, 5000)
    return () => { alive = false; clearInterval(t) }
  }, [API_BASE])

  // Load revenue chart (last 14 days)
  useEffect(() => {
    if (!API_BASE) return
    const to = new Date()
    const from = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
    fetch(`${API_BASE}/api/analytics/daily-revenue?from=${from.toISOString().slice(0,10)}&to=${to.toISOString().slice(0,10)}`)
      .then(r => r.json())
      .then((rows: any[]) => {
        const pts: Point[] = rows.map(r => ({ date: (r.date || '').slice(0,10), revenue: Number(r.revenue || 0) }))
        setRevenuePoints(pts)
      })
      .catch(() => setRevenuePoints([]))
  }, [API_BASE])

  if (!API_BASE) return <div className="p-3">Set VITE_API_BASE_URL to view admin dashboard.</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold mb-2">Admin Dashboard</h1>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi title="Total Revenue" value={`$${format(business?.revenue)}`} />
        <Kpi title="Total Orders" value={format(business?.orders)} />
        <Kpi title="Avg Order Value" value={`$${format(business?.avgOrderValue)}`} />
        <Kpi title="SSE Connections" value={format(perf?.sseConnections)} />
      </div>

      {/* Revenue chart + Orders by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <h2 className="font-medium mb-2">Revenue (Last 14 days)</h2>
          <MiniSparkline points={revenuePoints} />
        </section>
        <section className="border rounded p-3">
          <h2 className="font-medium mb-2">Orders by Status</h2>
          <div className="text-sm grid grid-cols-2 gap-y-1">
            {Object.entries(business?.ordersByStatus || {}).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></div>
            ))}
            {!business?.ordersByStatus && <div className="text-gray-500">No data</div>}
          </div>
        </section>
      </div>

      {/* Performance */}
      <section className="border rounded p-3">
        <h2 className="font-medium mb-2">Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Metric label="Requests" value={format(perf?.requestCount)} />
          <Metric label="Failed" value={format(perf?.failedRequests)} />
          <Metric label="Avg Latency (ms)" value={format(perf?.avgLatencyMs)} />
          <Metric label="Uptime (s)" value={format(perf?.uptimeSeconds)} />
          <Metric label="DB" value={perf?.db?.ok ? 'OK' : 'Down'} />
          <Metric label="LLM" value={perf?.llm?.configured ? (perf?.llm?.online ? 'Online' : 'Backoff') : 'Not configured'} />
        </div>
      </section>

      {/* Assistant analytics */}
      <section className="border rounded p-3">
        <h2 className="font-medium mb-2">Assistant Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Queries</div>
            <div className="text-lg font-semibold">{format(assistant?.queries)}</div>
            <div className="mt-3 text-sm">
              <div className="font-medium mb-1">Intent Distribution</div>
              {Object.entries(assistant?.intents || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-medium">{v}</span></div>
              ))}
              {!assistant?.intents && <div className="text-gray-500">No data</div>}
            </div>
          </div>
          <div>
            <div className="font-medium text-sm mb-1">Avg Response Time by Intent (ms)</div>
            <div className="text-sm">
              {Object.entries(assistant?.avgResponseMsByIntent || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-medium">{v.avgMs}</span></div>
              ))}
              {!assistant?.avgResponseMsByIntent && <div className="text-gray-500">No data</div>}
            </div>
          </div>
          <div>
            <div className="font-medium text-sm mb-1">LLM Latency by Intent (ms)</div>
            <div className="text-sm">
              {Object.entries(assistant?.llmLatencyByIntent || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-medium">{v.avgMs}</span></div>
              ))}
              {!assistant?.llmLatencyByIntent && <div className="text-gray-500">No data</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const Kpi: React.FC<{ title: string; value: string | number | undefined }> = ({ title, value }) => (
  <div className="border rounded p-3 bg-white">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-xl font-semibold">{value ?? '-'}</div>
  </div>
)

const Metric: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
  <div className="bg-white border rounded p-2">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-base font-medium">{value ?? '-'}</div>
  </div>
)
