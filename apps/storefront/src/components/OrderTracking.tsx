import React, { useEffect, useState } from 'react'
import { getOrderStatus } from '../lib/api'
import { connectOrderStream } from '../lib/sse-client'

type Props = { orderId: string }

export default function OrderTracking({ orderId }: Props) {
  const [status, setStatus] = useState<string>('Loading...')
  const [carrier, setCarrier] = useState<string | undefined>(undefined)
  const [eta, setEta] = useState<number | undefined>(undefined)
  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL

  useEffect(() => {
    let disconnect: (() => void) | null = null
    let pollTimer: any = null
    const isObjectId = /^[a-f\d]{24}$/i.test(orderId)
    ;(async () => {
      const info = await getOrderStatus(orderId)
      if (info) {
        setStatus(info.status)
        setCarrier(info.carrier)
        setEta(info.etaDays)
      }
      if (API_BASE && isObjectId) {
        disconnect = connectOrderStream(API_BASE, orderId, (ev) => {
          if (ev.status) {
            const map: Record<string,string> = { PENDING: 'Placed', PROCESSING: 'Packed', SHIPPED: 'Shipped', DELIVERED: 'Delivered' }
            setStatus(map[ev.status] || ev.status)
          }
        })
      } else {
        // Fallback: poll for status when not using real API IDs
        pollTimer = setInterval(async () => {
          const i = await getOrderStatus(orderId)
          if (i) {
            setStatus(i.status)
            setCarrier(i.carrier)
            setEta(i.etaDays)
            if (i.status === 'Delivered') clearInterval(pollTimer)
          }
        }, 3000)
      }
    })()
    return () => { if (disconnect) disconnect(); if (pollTimer) clearInterval(pollTimer) }
  }, [orderId])

  return (
    <div className="p-3 border border-zinc-200 rounded-xl bg-white">
      <div className="font-medium">Order {orderId}</div>
      <div className="mt-1">Status: <span className="font-semibold">{status}</span></div>
      {carrier && <div>Carrier: {carrier}</div>}
      {eta && <div>ETA: {eta} day(s)</div>}
    </div>
  )
}
