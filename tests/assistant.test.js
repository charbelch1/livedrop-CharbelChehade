jest.mock('../apps/api/src/db', () => require('./_helpers').makeDbModule())

// Mock function-registry to control LLM + KB behavior
jest.mock('../apps/api/src/assistant/function-registry', () => {
  return {
    getOrderStatus: async ({ orderId }) => ({ found: true, status: 'Shipped', carrier: 'UPS', estimatedDelivery: new Date(Date.now() + 3*24*60*60*1000) }),
    searchProducts: async () => ([ { name: 'Wireless Earbuds', price: 79 } ]),
    answerFromGroundTruth: () => ({ confidence: 3, answer: "Buyers can return most products within 30 days. [Returns1.1]", top: [{ id: 'Returns1.1', answer: '...' }] }),
    callLLM: async ({ prompt }) => {
      if (typeof prompt === 'string' && prompt.includes('Behavior (policy_question)')) {
        return { ok: false, output: '' }
      }
      return { ok: true, output: 'Okay! Your order is on the way. [Order1.1]' }
    },
  }
})

const { classify } = require('../apps/api/src/assistant/intent-classifier')
const { handleMessage } = require('../apps/api/src/assistant/engine')

describe('Intent Detection', () => {
  it('classifies order status', () => {
    expect(classify('Where is my order ABCDEFGHIJ?')).toBe('order_status')
    expect(classify('Track 68f12a5d14107bc735fd819f')).toBe('order_status')
  })
  it('classifies policy_question', () => {
    expect(classify('What is your 30-day return policy?')).toBe('policy_question')
    expect(classify('What is your refund policy?')).toBe('policy_question')
    expect(classify('shipping policy internationally?')).toBe('policy_question')
  })
  it('classifies product_search', () => {
    expect(classify('recommend wireless earbuds under $100')).toBe('product_search')
    expect(classify('looking for a 4K monitor')).toBe('product_search')
  })
  it('classifies complaint', () => {
    expect(classify('my item arrived damaged')).toBe('complaint')
    expect(classify("it doesn't work")).toBe('complaint')
  })
  it('classifies chitchat', () => {
    expect(classify('hello!')).toBe('chitchat')
  })
})

describe('Identity', () => {
  it("doesn't reveal model names", async () => {
    const res = await handleMessage({ message: "What's your name?" })
    expect(res.reply).not.toMatch(/ChatGPT|Llama|Claude|AI/i)
  })
  it('answers naturally to robot question', async () => {
    const res = await handleMessage({ message: 'Are you a robot?' })
    expect(typeof res.reply).toBe('string')
  })
  it('does not credit OpenAI/Meta on creator question', async () => {
    const res = await handleMessage({ message: 'Who created you?' })
    expect(res.reply).not.toMatch(/OpenAI|Meta|Anthropic/i)
  })
})

describe('Function Calling', () => {
  it('order status calls function and returns LLM reply + citation', async () => {
    const res = await handleMessage({ message: 'Where is my order 68f12a5d14107bc735fd819f?' })
    expect(res.functionsCalled).toContain('getOrderStatus')
    expect(res.functionsCalled).toContain('callLLM')
    expect(res.reply).toMatch(/\[Order1\.1\]/)
  })
  it('product search calls function and returns items', async () => {
    const res = await handleMessage({ message: 'find earbuds under $100' })
    expect(res.functionsCalled).toContain('searchProducts')
    expect(typeof res.reply).toBe('string')
  })
  it('policy question uses ground-truth with citations', async () => {
    const res = await handleMessage({ message: 'What is the return policy?' })
    expect(res.functionsCalled).toContain('answerFromGroundTruth')
    expect(res.reply).toMatch(/\[Returns1\.1\]/)
    expect(res.validation?.isValid).toBe(true)
  })
})
