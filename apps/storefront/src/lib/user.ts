import { create } from 'zustand'

export type Customer = { _id: string; name: string; email: string }

type UserState = {
  customer: Customer | null
  setCustomer: (c: Customer | null) => void
}

const STORAGE_KEY = 'sf_user_v1'

function load(): Customer | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
function save(c: Customer | null) { if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); else localStorage.removeItem(STORAGE_KEY) }

export const useUser = create<UserState>((set) => ({
  customer: load(),
  setCustomer: (c) => set(() => { save(c); return { customer: c } })
}))

