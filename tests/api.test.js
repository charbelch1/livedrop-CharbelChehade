const http = require('http')
jest.mock('../apps/api/src/db', () => require('./_helpers').makeDbModule())
const app = require('../apps/api/src/app')

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app)
    server.listen(0, () => resolve(server))
  })
}

async function fetchJson(server, path, init) {
  const { port } = server.address()
  const url = `http://127.0.0.1:${port}${path}`
  const res = await fetch(url, init)
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

describe('API basic', () => {
  let server
  beforeAll(async () => { server = await startServer() })
  afterAll(async () => { await new Promise(r => server.close(r)) })

  it('health returns ok', async () => {
    const res = await fetchJson(server, '/health')
    expect(res.status).toBe(200)
    expect(res.json.ok).toBe(true)
  })

  it('products list returns array', async () => {
    const res = await fetchJson(server, '/api/products')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.json.items)).toBe(true)
  })

  it('order creation with invalid data returns 400', async () => {
    const res = await fetchJson(server, '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    expect(res.status).toBe(400)
    expect(res.json.error?.code).toBe('BAD_REQUEST')
  })

  it('order creation with valid data succeeds', async () => {
    const customerId = require('./_helpers').hexId(33)
    const body = { customerId, items: [{ name: 'Wireless Earbuds', price: 79, quantity: 1 }] }
    const res = await fetchJson(server, '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    expect(res.status).toBe(201)
    expect(typeof res.json._id).toBe('string')
    expect(res.json.status).toBe('PENDING')
  })

  it('analytics daily revenue returns correct format', async () => {
    const res = await fetchJson(server, '/api/analytics/daily-revenue')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.json)).toBe(true)
    if (res.json.length) {
      const row = res.json[0]
      expect(row).toHaveProperty('date')
      expect(row).toHaveProperty('revenue')
      expect(row).toHaveProperty('orderCount')
    }
  })

  it('error responses are JSON', async () => {
    const res = await fetchJson(server, '/api/products/not-a-valid-id')
    expect([400,404,500]).toContain(res.status)
    expect(typeof res.json.error).toBe('object')
  })
})
