import React, { useEffect, useMemo, useState } from 'react'
import { listProducts } from '../lib/api'
import { useCart } from '../lib/store'
import { ProductCard } from '../components/molecules/ProductCard'

export const CatalogPage: React.FC = () => {
  const [q, setQ] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<'price-asc'|'price-desc'>('price-asc')
  const [products, setProducts] = useState<any[]>([])
  const add = useCart(s => s.add)

  useEffect(() => { listProducts().then(setProducts) }, [])

  // Show a concise set of popular tags as clickable buttons (top 8)
  const topTags = useMemo(() => {
    const freq = new Map<string, number>()
    for (const p of products) for (const t of (p.tags || [])) freq.set(t, (freq.get(t) || 0) + 1)
    return Array.from(freq.entries())
      .sort((a,b) => b[1] - a[1])
      .slice(0, 8)
      .map(([t]) => t)
  }, [products])

  const filtered = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean)
    let out = products.filter(p => {
      const hay = (p.title + ' ' + (p.tags || []).join(' ')).toLowerCase()
      const okQ = tokens.every(tk => hay.includes(tk))
      const okTag = tag ? (p.tags || []).includes(tag) : true
      return okQ && okTag
    })
    out.sort((a,b) => sort === 'price-asc' ? a.price - b.price : b.price - a.price)
    return out
  }, [products, q, tag, sort])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Browse Products</h1>
        <p className="text-sm text-zinc-500">Search and filter by tag, then sort by price.</p>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="border border-zinc-300 bg-white rounded-lg px-3 py-2 text-sm shadow-sm"
          placeholder="Search"
          value={q}
          onChange={e=>setQ(e.target.value)}
          aria-label="Search products"
        />
        <select
          className="border border-zinc-300 bg-white rounded-lg px-3 py-2 text-sm shadow-sm"
          value={sort}
          onChange={e=>setSort(e.target.value as any)}
          aria-label="Sort"
        >
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          className={`px-3 py-1.5 rounded-full text-sm border transition shadow-sm ${!tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-zinc-700 border-zinc-300 hover:border-indigo-300'}`}
          aria-pressed={!tag}
          onClick={() => setTag('')}
        >All</button>
        {topTags.map(t => (
          <button
            key={t}
            type="button"
            className={`px-3 py-1.5 rounded-full text-sm border transition shadow-sm ${tag===t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-zinc-700 border-zinc-300 hover:border-indigo-300'}`}
            aria-pressed={tag===t}
            onClick={() => setTag(tag===t ? '' : t)}
          >{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {filtered.map(p => (
          <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} image={p.image} onAdd={() => add({ id: p.id, title: p.title, price: p.price, image: p.image })} />
        ))}
      </div>
    </div>
  )
}

