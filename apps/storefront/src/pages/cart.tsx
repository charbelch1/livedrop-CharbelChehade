import React from 'react'
import { useCart, total } from '../lib/store'
import { formatCurrency } from '../lib/format'
import { useNavigate } from '../lib/router'

export const CartPage: React.FC = () => {
  const { items, setQty, remove } = useCart()
  const navigate = useNavigate()
  const sum = total(items)
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Your Cart</h1>
      {items.length === 0 && (
        <div className="text-zinc-600">Your cart is empty.</div>
      )}
      {items.length > 0 && (
        <div className="flex flex-col gap-3">
          {items.map(it => (
            <div key={it.id} className="flex items-center gap-3 border border-zinc-200 rounded-xl p-3 bg-white shadow-sm">
              <img src={it.image} alt={it.title} className="w-16 h-16 object-contain bg-zinc-100 rounded-lg" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{it.title}</div>
                <div className="text-zinc-600">{formatCurrency(it.price)}</div>
              </div>
              <div className="flex items-center gap-2" aria-label={`Quantity controls for ${it.title}`}>
                <button className="px-2 py-1 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50" onClick={() => setQty(it.id, it.qty - 1)} aria-label={`Decrease quantity for ${it.title}`}>−</button>
                <input aria-label={`Quantity for ${it.title}`} className="border border-zinc-300 bg-white rounded-lg px-2 py-1 w-16 text-center shadow-sm" type="number" min={1} value={it.qty} onChange={e => setQty(it.id, Number(e.target.value))} />
                <button className="px-2 py-1 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50" onClick={() => setQty(it.id, it.qty + 1)} aria-label={`Increase quantity for ${it.title}`}>+</button>
              </div>
              <button className="px-3 py-1 rounded-lg border border-zinc-300 text-zinc-600 hover:text-rose-600 hover:border-rose-300" onClick={() => remove(it.id)} aria-label={`Remove ${it.title}`}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {items.length > 0 && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-lg font-semibold">Total: {formatCurrency(sum)}</div>
          <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 shadow-sm w-full md:w-auto" onClick={() => navigate('/checkout')} aria-label="Proceed to checkout">Checkout</button>
        </div>
      )}
    </div>
  )
}
