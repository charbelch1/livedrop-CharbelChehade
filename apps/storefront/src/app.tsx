import React from 'react'
import { Router, Link, Route, useNavigate } from './lib/router'
import { CatalogPage } from './pages/catalog'
import { ProductPage } from './pages/product'
import { CartPage } from './pages/cart'
import { CheckoutPage } from './pages/checkout'
import { OrderStatusPage } from './pages/order-status'
import { useCart } from './lib/store'
import { SupportPanel } from './components/organisms/SupportPanel'
import AdminDashboard from './pages/AdminDashboard'
import LoginPage from './pages/login'
import { useUser } from './lib/user'

export const App: React.FC = () => {
  // Expose API base globally for libs that read at runtime
  ;(window as any).__API_BASE__ = (import.meta as any).env?.VITE_API_BASE_URL
  console.log('VITE_API_BASE_URL=', (import.meta as any).env?.VITE_API_BASE_URL)
  return (
    <Router>
      <Shell />
    </Router>
  )
}

const Shell: React.FC = () => {
  const cartCount = useCart((s) => s.items.reduce((a, it) => a + it.qty, 0))
  const navigate = useNavigate()
  console.log('VITE_API_BASE_URL=', (import.meta as any).env?.VITE_API_BASE_URL)
  const customer = useUser(s => s.customer)
  const setCustomer = useUser(s => s.setCustomer)
  const logout = () => { setCustomer(null); navigate('/login') }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-zinc-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="font-semibold text-zinc-900 hover:text-indigo-600 transition">Storefront</Link>
          <nav className="ml-auto flex items-center gap-2">
            <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 transition">Catalog</Link>
            <Link href="/admin" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 transition">Admin</Link>
            {!customer && (<Link href="/login" className="px-3 py-1.5 rounded-full hover:bg-zinc-100 transition">Login</Link>)}
            {customer && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <span className="hidden sm:inline">Hi</span>
                <span className="font-medium text-zinc-900">{customer.email}</span>
                <button className="ml-2 px-3 py-1.5 border border-zinc-300 rounded-full hover:bg-zinc-100" onClick={logout}>Logout</button>
              </div>
            )}
            <button className="ml-2 relative px-3 py-1.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition" onClick={() => navigate('/cart')} aria-label="Open cart">
              Cart{cartCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center text-xs bg-white text-zinc-900 rounded-full px-2 border border-zinc-300">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Route path="/" component={<CatalogPage />} />
        <Route path="/p/:id" component={<ProductPage />} />
        <Route path="/cart" component={<CartPage />} />
        <Route path="/checkout" component={<CheckoutPage />} />
        <Route path="/order/:id" component={<OrderStatusPage />} />
        <Route path="/admin" component={<AdminDashboard />} />
        <Route path="/login" component={<LoginPage />} />
      </main>
      <SupportPanel />
      <footer className="border-t border-zinc-200 text-sm text-zinc-500 py-4 text-center">Livedrops ©</footer>
    </div>
  )
}
