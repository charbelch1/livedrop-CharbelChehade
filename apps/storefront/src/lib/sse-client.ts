export type OrderSseEvent = { status?: string; updatedAt?: string; done?: boolean; error?: string }

export function connectOrderStream(baseUrl: string, orderId: string, onMessage: (ev: OrderSseEvent) => void) {
  const url = `${baseUrl.replace(/\/$/, '')}/api/orders/${orderId}/stream`
  const es = new EventSource(url)
  es.addEventListener('status', (e: MessageEvent) => {
    try { onMessage(JSON.parse(e.data)) } catch { /* noop */ }
  })
  es.addEventListener('done', (e: MessageEvent) => {
    try { onMessage({ ...(JSON.parse(e.data)||{}), done: true }) } catch { onMessage({ done: true }) }
    es.close()
  })
  es.addEventListener('error', () => {
    onMessage({ error: 'stream_error' })
  })
  return () => es.close()
}

