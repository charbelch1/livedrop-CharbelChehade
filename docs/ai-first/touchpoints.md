# AI Touchpoint Specs

## 1) Support Assistant (FAQ + Order Status via RAG)

**Problem statement.**  
Users frequently ask policy/FAQ questions and “where is my order?” in chat. Today, many simple queries escalate unnecessarily to human agents. This touchpoint will ground answers strictly in the Policies/FAQ markdown and, when the user provides an order id/email, call the existing `order-status` API to return status, ETA, and next steps. The goal is to reduce support contact rate while improving response time and consistency.

**Happy path (6–10 steps).**
1. User opens chat and submits a question (e.g. “where is my order 1234?”).  
2. Client sends message to `/support/assist` with session id and (optional) order id/email.  
3. Backend runs intent + entity detection (simple rules + lightweight model).  
4. If order intent and id present → call `GET /order-status/:id` (existing API).  
5. Retrieve top K FAQ/policy chunks (BM25 or embeddings) scoped to approved collections.  
6. Compose grounded context (answerable snippets + order status JSON).  
7. Generate answer with citations and recommended next action (refund link, tracking, etc.).  
8. Cache response key on (normalized question, policy hash, order status ETag) for 24h.  
9. Return answer; client renders with “Was this helpful?” and “Contact support” CTA.  
10. Record analytics event (deflection, confidence score, latency).  

**Grounding & guardrails.**
- **Source of truth:** `docs/policies.md`, `docs/faq.md`, `order-status` API.  
- **Retrieval scope:** Only these files/collections; no open web.  
- **Max context:** ≤800 tokens of snippets + ≤200 tokens of order JSON.  
- **Refuse outside scope:** If unsupported, reply “I don’t have that info” + escalate option.  

**Human-in-the-loop.**
- **Escalation triggers:** model confidence <0.5, policy gaps, toxic/PII, or 2+ failed turns.  
- **UI surface:** “Contact support” button with transcript prefilled.  
- **Reviewer & SLA:** Tier-1 reviews flagged conversations within 4 business hours; 2% weekly random QA sample.  

**Latency budget (p95 ≤1200ms).**

| Step | Budget (ms) |
|------|-------------|
| Intent/routing | 40 |
| Order-status API | 300 (timeout at 600; if timeout → fallback) |
| Retrieval (index + rank) | 250 |
| Context assembly | 60 |
| Generation (Llama 3.1 8B Instruct, 200–250 out) | 400 |
| Post-processing (citations, templates) | 60 |
| Network & overhead | 80 |
| **Total** | **~1190ms** |

**Cache strategy:** ~30% hit rate expected (FAQ repeats); cache at edge by `(normalized question + policy hash)`.

**Error & fallback behavior.**
- Order API 4xx/5xx/timeout → return “We couldn’t fetch order status right now” + link to tracking email + escalation option.  
- Retrieval empty → apologize + escalate.  
- Generation failure → serve top policy snippet verbatim with link.  

**PII handling.**
- Only order id + last-4 email/phone leave the app.  
- Redact in prompts (`u***@d***.com`, `***-***-1234`).  
- Logs store hashes, not raw PII; transient tokens in secure vault only.  

**Success metrics.**
- **Product:** Deflection rate = (# conversations resolved without human) ÷ (# total conversations).  
- **Product:** First-response time (p95) = p95(latency of first assistant response across all sessions).  
- **Business:** Support contact rate = (# human-handled tickets) ÷ (# sessions).  

**Feasibility note.**  
We already have FAQs/Policies markdown and the `order-status` API. Retrieval can run locally (BM25 or embeddings). Use Llama 3.1 8B Instruct via OpenRouter for generation. Next prototype: build an offline indexer for policies, expose a thin `/assist` endpoint, and validate on 20–50 golden questions.

---

## 2) Semantic Typeahead for Search Suggestions

**Problem statement.**  
Users often type partial or colloquial terms that keyword prefix match misses (“coffe mug” vs. “coffee cup”). This touchpoint will provide semantic suggestions that map queries to categories/SKUs quickly, improving search success and product discovery.

**Happy path (6–10 steps).**
1. User types ≥2 characters in search box (debounced at 80ms).  
2. Client calls `/search/suggest?q=...&sid=...`.  
3. Backend normalizes/typo-corrects query.  
4. Fetch top N candidates from Redis memory index (prefix + popularity).  
5. If miss/ambiguous → run semantic rerank on 50–100 candidates.  
6. Blend with business rules (stock status, promoted categories).  
7. Cache result by `(q trigram, locale, index version)` for 10 minutes.  
8. Return 5–8 suggestions with URLs.  
9. Log impressions and clicks for offline CTR training.  
10. If LLM unavailable → fallback to pure prefix-only suggestions.  

**Grounding & guardrails.**
- **Source of truth:** Catalog titles, categories/tags (daily snapshot).  
- **Retrieval scope:** Catalog index only; no generative hallucinations.  
- **Max context:** ≤120 tokens input, ≤20 tokens output.  
- **Refuse outside scope:** If non-shopping intent → show “Open help” chip instead.  

**Human-in-the-loop.**
- None required in real time. Merch admins review low-CTR queries weekly and can pin suggestions.

**Latency budget (p95 ≤300ms).**

| Step | Budget (ms) |
|------|-------------|
| Frontend debounce | 80 |
| Redis candidate fetch | 50 |
| Semantic rerank (distilled cross-encoder or Llama 3.1 8B short prompt) | 120 |
| Blend/format | 25 |
| Network & overhead | 25 |
| **Total** | **~300ms** |

**Cache strategy:** ~70% hit rate expected on popular prefixes; CDN/edge cache keyed on `(q trigram, locale)`.

**Error & fallback behavior.**
- If semantic rerank fails → return prefix-only suggestions.  
- If Redis/index miss → return trending searches list.  

**PII handling.**
- Only query text is processed.  
- Session id hashed client-side; no raw PII in logs.  

**Success metrics.**
- **Product:** Suggest CTR = (# suggestion clicks) ÷ (# impressions).  
- **Product:** Search success = (# sessions with product view after suggest click) ÷ (# sessions with suggest click).  
- **Business:** Conversion uplift = (conversion_rate_with_click − conversion_rate_control) ÷ conversion_rate_control.  

**Feasibility note.**  
We have catalog metadata and can export to Redis for prefix search. Semantic rerank can start with a distilled cross-encoder (cost-efficient) or Llama 3.1 8B Instruct for tail queries. Next prototype: generate candidate sets offline, deploy rerank microservice, and A/B test behind a feature flag.
