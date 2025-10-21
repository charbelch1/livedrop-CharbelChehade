export type Product = { id: string; title: string; price: number; image: string; tags: string[]; stockQty: number; description?: string }

// Real API base (Week 5). Use a function so it always reflects current env.
function API_BASE() {
  const w: any = typeof window !== 'undefined' ? (window as any) : {}
  return w.__API_BASE__ || (import.meta as any)?.env?.VITE_API_BASE_URL || undefined
}

const ORDERS_KEY = 'sf_orders_v1'
type OrderInfo = { id: string; status: 'Placed'|'Packed'|'Shipped'|'Delivered'; carrier?: string; etaDays?: number }

function loadOrders(): Record<string, OrderInfo> { try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '{}') } catch { return {} } }
function saveOrders(map: Record<string, OrderInfo>) { localStorage.setItem(ORDERS_KEY, JSON.stringify(map)) }

export async function listProducts(): Promise<Product[]> {
  const base = API_BASE()
  if (base) {
    console.log('[lib/api] GET /api/products base=', base)
    const res = await fetch(`${base}/api/products`)
    const json = await res.json()
    // Map API -> UI shape
    const items = (json.items || json).map((p: any) => ({
      id: p._id || p.id,
      title: p.name || p.title,
      price: p.price,
      image: p.imageUrl || p.image,
      tags: p.tags || [],
      stockQty: p.stock ?? p.stockQty ?? 0,
      description: p.description || ''
    }))
    return items
  }
  const res = await fetch('/mock-catalog.json')
  const data: Product[] = await res.json()
  return data
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const base = API_BASE()
  if (base) {
    console.log('[lib/api] GET /api/products/:id base=', base)
    const res = await fetch(`${base}/api/products/${id}`)
    if (res.status === 404) return undefined
    const p = await res.json()
    return {
      id: p._id || p.id,
      title: p.name || p.title,
      price: p.price,
      image: p.imageUrl || p.image,
      tags: p.tags || [],
      stockQty: p.stock ?? p.stockQty ?? 0,
      description: p.description || ''
    }
  }
  const list = await listProducts()
  return list.find(p => p.id === id)
}

export async function placeOrder(cart: { id: string; qty: number; price?: number; name?: string }[], customerId?: string) {
  // If API_BASE is set, always use the real API. Require a customerId.
  const base = API_BASE()
  if (base) {
    if (!customerId) throw new Error('MISSING_CUSTOMER_ID')
    const items = cart.map(c => ({ productId: c.id, quantity: c.qty, price: c.price ?? 0, name: c.name }))
    // Debug trace
    console.log('[lib/api] POST /api/orders', { base, customerId, items })
    const res = await fetch(`${base}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId, items }) })
    if (!res.ok) {
      const text = await res.text().catch(() => 'Failed to place order')
      throw new Error(text)
    }
    const data = await res.json()
    return { orderId: data._id }
  }
  // Fallback (no API configured): local fake order
  const orderId = randomId(12)
  const map = loadOrders()
  map[orderId] = { id: orderId, status: 'Placed' }
  saveOrders(map)
  return { orderId }
}

export async function getOrderStatus(id: string): Promise<OrderInfo | undefined> {
  const base = API_BASE()
  if (base) {
    console.log('[lib/api] GET /api/orders/:id base=', base)
    const res = await fetch(`${base}/api/orders/${id}`)
    if (res.status === 404) return undefined
    const o = await res.json()
    const statusMap: Record<string, OrderInfo['status']> = { PENDING: 'Placed', PROCESSING: 'Packed', SHIPPED: 'Shipped', DELIVERED: 'Delivered' }
    const status = statusMap[o.status] || 'Placed'
    const info: OrderInfo = { id, status, carrier: o.carrier, etaDays: o.estimatedDelivery ? Math.ceil((new Date(o.estimatedDelivery).getTime() - Date.now()) / (24*60*60*1000)) : undefined }
    return info
  }
  const map = loadOrders()
  let info = map[id]
  if (!info) return undefined
  const steps: OrderInfo['status'][] = ['Placed','Packed','Shipped','Delivered']
  const idx = steps.indexOf(info.status)
  if (idx >= 0 && idx < steps.length - 1) {
    if (Math.random() < 0.3) {
      info = { ...info, status: steps[idx + 1] }
      if (info.status === 'Shipped') info = { ...info, carrier: 'UPS', etaDays: 3 }
      saveOrders({ ...map, [id]: info })
    }
  }
  return info
}

function randomId(len: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random()*chars.length)]
  return s
}

