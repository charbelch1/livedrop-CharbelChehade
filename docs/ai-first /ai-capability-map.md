# AI Capability Map — ShopLite (Week 2)

| Capability | Intent (user) | Inputs (this sprint) | Risk 1–5 (tag) | p95 ms | Est. cost/action | Fallback | Selected |
|---|---|---|---|---:|---:|---|:---:|
| AI-Enhanced Search (natural-language & feature-based) | Find relevant products fast using plain language (“black running shoe under $100 with cushioning”) | Product catalog (10k SKUs), titles, specs, embeddings | 3 | 300 | ~$0.0245 | Keyword search + trending products | ✅ |
| FAQ & Policies Chatbot (support assistant with intent gating) | Get answers on returns, shipping, policies, order-by-id | FAQ.md, Policies.md, Order-Status API | 3 | 1200 | ~$0.18 | Static FAQ / link to support | ✅ |
| AI-Powered Product Descriptions (review+spec summarization) | Understand quality/features without reading long reviews | Product descriptions, customer reviews | 4 | 1000 | ~$0.12 | Show original description + reviews |  |
| Order Summarizer & Proactive Notifications | See open orders, ETAs, delays in one line | Order-Status API, user prefs | 2 | 800 | ~$0.08 | Raw order status via API |  |

**Why these two.** AI-Enhanced Search directly lifts product discovery and conversion by interpreting feature-rich queries and reranking results; it uses catalog data we already have and is low-risk operationally. The Support Chatbot reduces contact rate and improves CSAT by answering policy/returns questions with RAG over our own docs and gating off irrelevant queries. Both fit the assignment’s p95 targets (≤300 ms for search, ≤1200 ms for support) and require minimal backend changes beyond embeddings + a small RAG service layer.
