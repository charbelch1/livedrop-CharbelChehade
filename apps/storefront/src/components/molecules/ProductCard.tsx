import React from 'react'
import { Button } from '../atoms/Button'
import { formatCurrency } from '../../lib/format'
import { Link } from '../../lib/router'

type Props = { id: string; title: string; price: number; image: string; onAdd: () => void }
export const ProductCard: React.FC<Props> = ({ id, title, price, image, onAdd }) => (
  <div className="border border-zinc-200 rounded-xl p-4 flex flex-col gap-3 bg-white hover:shadow-md transition">
    <Link href={`/p/${id}`} className="block aspect-square overflow-hidden rounded-lg bg-zinc-100">
      <img src={image} alt={title} loading="lazy" className="w-full h-full object-contain" />
    </Link>
    <Link href={`/p/${id}`} className="font-medium text-zinc-900 line-clamp-2 min-h-[2.5rem] hover:text-indigo-700 transition">{title}</Link>
    <div className="flex items-center justify-between">
      <div className="font-semibold text-zinc-800">{formatCurrency(price)}</div>
      <Button onClick={onAdd} aria-label={`Add ${title} to cart`}>Add to Cart</Button>
    </div>
  </div>
)
