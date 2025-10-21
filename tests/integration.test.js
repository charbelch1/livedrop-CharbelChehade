const http = require('http')
jest.mock('../apps/api/src/db', () => require('./_helpers').makeDbModule())
const app = require('../apps/api/src/app')
const { handleMessage } = require('../apps/api/src/assistant/engine')

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

describe('Integration Workflows', () => {
  let server
  beforeAll(async () => { server = await startServer() })
  afterAll(async () => { await new Promise(r => server.close(r)) })

  it('Complete Purchase Flow', async () => {
    // 1. Browse products
    const prods = await fetchJson(server, '/api/products')
    expect(prods.status).toBe(200)
    const p = prods.json.items[0]

    // 2. Create order
    const customerId = require('./_helpers').hexId(44)
    const orderRes = await fetchJson(server, '/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId, items: [{ productId: p._id, price: p.price, quantity: 1 }] }) })
    expect(orderRes.status).toBe(201)
    const orderId = orderRes.json._id

    // 3. Subscribe to SSE
    const { port } = server.address()
    const url = `http://127.0.0.1:${port}/api/orders/${orderId}/stream`
    const evts = []
    await new Promise((resolve) => {
      const req = http.get(url, (res) => {
        res.setEncoding('utf8')
        res.on('data', (chunk) => { evts.push(chunk); if (evts.join('').includes('event: status')) { req.destroy(); resolve(null) } })
      })
    })
    expect(evts.join('')).toMatch(/event: status/)

    // 4. Ask assistant about order status
    const msg = `Where is my order ${orderId}?`
    const ans = await handleMessage({ message: msg })
    expect(ans.intent).toBe('order_status')
    expect(ans.functionsCalled).toContain('getOrderStatus')

    // 5. Verify response shape
    expect(typeof ans.reply).toBe('string')
  })

  it('Support Interaction Flow', async () => {
    const a = await handleMessage({ message: 'What is your 30-day return policy?' })
    expect(typeof a.reply).toBe('string')
    const b = await handleMessage({ message: 'Where is my order ABCDEFGHIJ?' })
    expect(b.intent).toBe('order_status')
    const c = await handleMessage({ message: 'This arrived damaged' })
    expect(c.intent).toBe('complaint')
  })

  it('Multi-Intent Conversation', async () => {
    const s1 = await handleMessage({ message: 'hello' })
    expect(s1.intent).toBe('chitchat')
    const s2 = await handleMessage({ message: 'recommend earbuds under $100' })
    expect(s2.intent).toBe('product_search')
    const s3 = await handleMessage({ message: 'what is your return policy' })
    expect(s3.intent).toBe('policy_question')
    const s4 = await handleMessage({ message: 'track 68f12a5d14107bc735fd819f' })
    expect(s4.intent).toBe('order_status')
  })
})
