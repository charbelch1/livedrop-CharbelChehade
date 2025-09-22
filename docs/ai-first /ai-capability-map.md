# AI Capability Map — ShopLite (Week 2)

| Capability | Intent (user) | Inputs (this sprint) | Risk 1–5 (tag) | p95 ms | Est. cost/action | Fallback | Selected |
|---|---|---|---|---:|---:|---|:---:|
| AI-Enhanced Search (natural-language & feature-based) | Find relevant products fast using plain language (“black running shoe under $100 with cushioning”) | Product catalog (10k SKUs), titles, specs, embeddings | 3 | 300 | ~$0.0245 | Keyword search + trending products | ✅ |
| FAQ & Policies Chatbot (support assistant with intent gating) | Get answers on returns, shipping, policies, order-by-id | FAQ.md, Policies.md, Order-Status API | 3 | 1200 | ~$0.18 | Static FAQ / link to support | ✅ |
| AI-Powered Product Descriptions (review+spec summarization) | Understand quality/features without reading long reviews | Product descriptions, customer reviews | 4 | 1000 | ~$0.12 | Show original description + reviews |  |
| Order Summarizer & Proactive Notifications | See open orders, ETAs, delays in one line | Order-Status API, user prefs | 2 | 800 | ~$0.08 | Raw order status via API |  |

**Why these two:** We selected AI-Enhanced Search and the Q&A Chatbot because they provide the clearest impact on key user-facing KPIs. The enhanced search improves product discovery and drives conversion by helping users find the right items with the exact features he wants in this product in the fastest time even without knowing exact names. The chatbot reduces support contact rate by automating answers to frequently asked questions and individual order queries, improving customer satisfaction and operational efficiency. Both features have low integration risk since they leverage existing data — the product catalog for search and FAQ/policies (plus the order-status API) for the chatbot — without requiring major backend changes, while satisfying the p95 targets.
