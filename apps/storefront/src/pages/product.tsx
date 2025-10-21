import React, { useEffect, useMemo, useState } from 'react'
import { getProduct, listProducts } from '../lib/api'
import { useParams } from '../lib/router'
import { useCart } from '../lib/store'
import { ProductCard } from '../components/molecules/ProductCard'
import { formatCurrency } from '../lib/format'

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<any>()
  const [all, setAll] = useState<any[]>([])
  const add = useCart(s => s.add)
  useEffect(() => { getProduct(id).then(setProduct); listProducts().then(setAll) }, [id])

  const related = useMemo(() => {
    if (!product) return []
    const tag = product.tags[0]
    return all.filter(p => p.id !== product.id && p.tags.includes(tag)).slice(0,3)
  }, [product, all])

  if (!product) return <div>Loading...</div>

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-4">
        <img src={product.image} alt={product.title} className="w-full h-auto object-contain" />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{product.title}</h1>
        <div className="text-xl font-bold text-zinc-900">{formatCurrency(product.price)}</div>
        <div className={product.stockQty>0? 'text-emerald-600':'text-rose-600'}>
          {product.stockQty>0? `In stock (${product.stockQty})` : 'Out of stock'}
        </div>
        <p className="text-zinc-600">{product.description ?? 'Great product.'}</p>
        <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 w-fit shadow-sm" onClick={() => add({ id: product.id, title: product.title, price: product.price, image: product.image })}>Add to Cart</button>
        <div>
          <h2 className="mt-6 mb-2 font-semibold">Related</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {related.map(p => (
              <ProductCard key={p.id} id={p.id} title={p.title} price={p.price} image={p.image} onAdd={() => add({ id: p.id, title: p.title, price: p.price, image: p.image })} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
