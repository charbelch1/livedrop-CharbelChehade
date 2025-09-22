# Touchpoint Specs

## 1) AI-Enhanced Search (Natural-Language & Feature-Based)

**Problem statement.** Users struggle when they don’t know exact SKUs; keyword search misses multi-constraint queries (budget, color, spec). We need a retrieval-and-rank system that parses features from natural language, filters by structured attributes, and returns ranked results personalized by inventory/size/brand preferences.

**Happy path (p95 ≤ 300 ms).**
1. User types a query in search.
2. Lightweight parser extracts constraints (price caps, attributes, brand, size).
3. Vector retrieval returns top-N candidate products from embeddings index.
4. Structured filter narrows by hard constraints (price, size, availability).
5. Optional LLM reranker (only when needed, e.g., ambiguous queries) reorders top-K.
6. Personalization layer boosts items by user prefs/inventory.
7. Results render with facets; user can refine.
8. Telemetry logs query success and clicks (no PII).

**Grounding & guardrails.**
- Source of truth: product catalog (10k SKUs) in SQL + embeddings store.
- Retrieval scope: current catalog only; block out-of-catalog answers.
- Max context to LLM (when used): ≤ 2,000 tokens (query + top-K product snippets).
- Refuse outside scope: return “Please refine your product search.”

**Human-in-the-loop.**
- Escalation triggers: <1% CTR over 200 queries of the same pattern _or_ 3 consecutive “no good results” user flags.
- UI surface: search results page with “Was this helpful?” control.
- Reviewer & SLA: Search owner reviews weekly; backlog triage within 5 business days.

**Latency budget (p95).**
- Constraint parsing + feature filter: 20–40 ms  
- Vector retrieval (ANN): 80–120 ms  
- Optional LLM rerank (only ~30% queries): 120–160 ms  
- API orchestration + network: 30–50 ms  
- **Total:** ≤ 300 ms (on paths without LLM rerank typically ≤ 200 ms)

**Error & fallback behavior.**
- If embeddings/vector DB unavailable → fallback to keyword search + “Popular now”.
- If reranker times out → return filtered vector results.
- Always return something; never blank page.

**PII handling.**
- No PII leaves app; queries logged with hashed user id and redacted free text.
- Drop emails/phone numbers if detected in query before logging.

**Success metrics.**
- Product metric 1: Search result CTR = clicks on result / total AI searches.
- Product metric 2: Search→Purchase conversion = purchases after AI search / total AI searches.
- Business metric: Avg order value uplift = AOV (AI search users) − AOV (non-AI search).

**Feasibility note.**
- Data: product catalog with structured attributes is available; embeddings can be precomputed offline.
- Tools: FAISS/Pinecone + small reranker model.
- Next step: build query→embedding→retrieve→filter prototype and run a 1-week probe on relevance + latency.


## 2) FAQ & Policies Chatbot (Support Assistant with Intent Gating)

**Problem statement.** Users ask about returns, shipping, and policies. Answers exist in our FAQ/Policies docs, but finding them is slow. A RAG assistant with strict intent gating can answer safely and fast, reducing tickets and improving self-service.

**Happy path (p95 ≤ 1200 ms).**
1. User opens chat and asks a question.
2. Intent classifier (small model) checks if the query is ShopLite-support-related.
3. If unrelated → polite refusal with “I can answer ShopLite questions only.”
4. If related → retrieve top FAQ/policy chunks.
5. LLM drafts an answer citing sources (titles/anchors).
6. Answer shown with quick-actions (view policy, start a return).
7. Follow-ups maintain short chat context.
8. User can escalate to human at any time.

**Grounding & guardrails.**
- Source of truth: `FAQ.md`, `Policies.md`, and Order-Status API for single-order lookups.
- Retrieval scope: whitelisted docs only; no web search.
- Max context: ≤ 3,000 tokens (question, top 8 chunks).
- Refuse outside scope: intent gate or “I don’t have that info. Here’s Support.”

**Human-in-the-loop.**
- Escalation triggers: user asks; confidence < 0.5; or 2 failed answers in a session.
- UI surface: chat widget.
- Reviewer & SLA: Support team reviews flagged conversations daily; responses to escalations within 1 business day.

**Latency budget (p95).**
- Intent classification: 50–80 ms  
- Retrieval (vector store): 120–200 ms  
- Answer generation (LLM): 600–800 ms  
- Orchestration & network: 80–120 ms  
- **Total:** ≤ 1,200 ms

**Error & fallback behavior.**
- If LLM fails/timeouts → show static FAQ answer or link to policy/help center.
- If retrieval fails → attempt keyword lookup; otherwise show relevant policy index.

**PII handling.**
- No PII in logs; redact order ids except last 4 if surfaced.
- Do not store chat transcripts longer than 30 days; strip tokens of names/emails.

**Success metrics.**
- Product metric 1: Auto-resolution rate = auto-resolved / total chatbot queries.
- Product metric 2: Avg response time = Σ(response time) / total chatbot queries.
- Business metric: Support contact reduction = (baseline contacts − post-launch) / baseline.

**Feasibility note.**
- Data available (FAQ/Policies); order-by-id API exists.
- Tools: vector store + LLM; lightweight classifier for intent.
- Next step: wire RAG over FAQ/Policies and run a 2-day dry-run with scripted queries.
