import { create } from 'zustand'

export type CartItem = { id: string; title: string; price: number; image: string; qty: number }
type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

const STORAGE_KEY = 'sf_cart_v1'

function load(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function save(items: CartItem[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }

export const useCart = create<CartState>((set, get) => ({
  items: load(),
  add: (item, qty = 1) => set(() => {
    const items = [...get().items]
    const i = items.findIndex(it => it.id === item.id)
    if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + qty }
    else items.push({ ...item, qty })
    save(items); return { items }
  }),
  remove: (id) => set(() => { const items = get().items.filter(it => it.id !== id); save(items); return { items } }),
  setQty: (id, qty) => set(() => { const items = get().items.map(it => it.id === id ? { ...it, qty: Math.max(1, qty) } : it); save(items); return { items } }),
  clear: () => set(() => { save([]); return { items: [] } }),
}))

export function total(items: CartItem[]) { return items.reduce((a, it) => a + it.price * it.qty, 0) }

