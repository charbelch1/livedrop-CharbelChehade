import React from 'react'
import { useCart, total } from '../lib/store'
import { formatCurrency } from '../lib/format'
import { placeOrder } from '../lib/api'
import { useNavigate } from '../lib/router'
import { useUser } from '../lib/user'

export const CheckoutPage: React.FC = () => {
  const { items, clear } = useCart()
  const navigate = useNavigate()
  const customer = useUser(s => s.customer)
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL
  const [error, setError] = React.useState<string | null>(null)
  async function onPlace() {
    setError(null)
    try {
      const cart = items.map(it => ({ id: it.id, qty: it.qty, price: it.price, name: it.title }))
      // Prefer direct POST here for clarity in Network tab
      const base = API_BASE as string | undefined
      console.log('placeOrder debug', { API_BASE: base, customerId: customer?._id, cart })
      let orderId: string
      if (base && customer?._id) {
        const itemsPayload = cart.map(c => ({ productId: c.id, quantity: c.qty, price: c.price ?? 0, name: c.name }))
        console.log('[checkout] POST /api/orders', { base, customerId: customer._id, items: itemsPayload })
        const res = await fetch(`${base}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: customer._id, items: itemsPayload }) })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        orderId = data._id
      } else {
        // Fallback to lib helper (local order) if API not configured
        const out = await placeOrder(cart, customer?._id)
        orderId = out.orderId
      }
      clear()
      navigate(`/order/${orderId}`)
    } catch (e: any) {
      console.error('placeOrder error', e)
      setError(typeof e?.message === 'string' ? e.message : 'Failed to place order')
    }
  }
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Checkout</h1>
      {API_BASE && !customer && (
        <div className="p-3 border border-amber-500/30 bg-amber-500/10 rounded text-sm">
          You are not identified. Please <a href="#/login" className="underline">log in</a> with your email (e.g., demo@example.com) so your order is associated to a profile.
        </div>
      )}
      {error && (
        <div className="p-3 border border-red-500/30 bg-red-500/10 rounded text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="border border-zinc-200 rounded-xl p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Order Summary</h2>
          <div className="text-sm text-zinc-600">{items.length} item{items.length!==1?'s':''}</div>
        </div>
        {items.map(it => (
          <div key={it.id} className="flex justify-between py-1">
            <span className="truncate pr-3">{it.title} × {it.qty}</span>
            <span>{formatCurrency(it.price * it.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t mt-3 pt-3 font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total(items))}</span>
        </div>
      </div>
      <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 w-full md:w-fit shadow-sm disabled:opacity-50" onClick={onPlace} disabled={items.length===0 || (API_BASE && !customer)}>
        Place order
      </button>
    </div>
  )
}

