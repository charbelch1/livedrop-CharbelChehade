import React from 'react'
import { useParams } from '../lib/router'
import OrderTracking from '../components/OrderTracking'

export const OrderStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Order {maskId(id)}</h1>
      <OrderTracking orderId={id} />
    </div>
  )
}

function maskId(id: string) {
  if (!id) return ''
  const visible = id.slice(-4)
  const masked = '.'.repeat(Math.max(0, id.length - 4))
  return masked + visible
}
