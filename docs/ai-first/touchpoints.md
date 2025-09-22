# Touchpoint Specs

## 1) AI-Enhanced Search (Natural-Language & Feature-Based)

### Problem Statement
Users struggle when they don’t know exact SKUs; keyword search misses multi-constraint queries (budget, color, spec). We need a retrieval-and-rank system that parses features from natural language, filters by structured attributes, and returns ranked results personalized by inventory/size/brand preferences.


### Happy Path (p95 ≤ 300 ms)
1. User types a query in search.  
2. **LLM parses the query** to extract intent and required features.  
3. **Vector search + attribute filtering** retrieves candidate products from the catalog.  
4. **LLM reranks top results**, evaluating semantic match and user’s stated constraints.  
5. Personalization layer adjusts results further using browsing/purchase history and available inventory.  
6. Results displayed in ranked order, showing only products that satisfy constraints.  
7. User may refine query or toggle filters for adjustments.  


### Grounding & Guardrails
- **Source of truth:** product catalog (10k SKUs) in SQL + embeddings store.  
- **Retrieval scope:** only current catalog; block out-of-catalog answers.  
- **Max LLM context:** ≤ 1,000 tokens (query + top-K product snippets).  
- **Out-of-scope queries:** reply: *“Please refine your product search.”*  


### Human-in-the-Loop
- **Escalation triggers:**  
  - <1% CTR over 200 queries of the same pattern.  
  - 3 consecutive “no good results” flags from users.  
- **UI surface:** search results page with feedback control (“Was this helpful?”).  
- **Reviewer & SLA:** Search team reviews weekly; fixes prioritized within 5 business days.  


### Latency Budget (p95)
- LLM constraint parsing: **50–80 ms**  
- Vector retrieval (ANN): **80–120 ms**  
- LLM rerank (scoring top-K results): **100–140 ms**  
- API orchestration + network: **30–50 ms**  
- **Total:** ~280–300 ms
  

### Error & Fallback Behavior
- If embeddings/vector DB unavailable → fallback to keyword search + *“Popular now”*.  
- If reranker call times out → return filtered vector results without reranking.  
- Always return something (never blank page).  


### PII Handling
- No PII leaves the app.  
- Logs include hashed user IDs and redacted queries.  
- Strip emails/phone numbers if detected before logging.  

### Success Metrics
- **Product metric 1:** Search CTR = clicks / total AI searches.  
- **Product metric 2:** Search→Purchase conversion = purchases after AI search / total AI searches.  
- **Business metric:** AOV uplift = AOV (AI search users) − AOV (non-AI search).  


### Feasibility Note
- **Data:** product catalog with structured attributes available; embeddings precomputed offline.  
- **Tools:**  
  - FAISS/Pinecone (vector search).  
  - **LLM** for both query parsing + reranking.  
- **Next step:** prototype query→embedding→retrieve→rerank pipeline; run 1-week test on relevance + latency.  


## 2) FAQ & Policies Chatbot (Support Assistant with Intent Gating)

**Problem statement.** Users ask about returns, shipping, and policies. Answers exist in our FAQ/Policies docs, but finding them is slow. A RAG assistant with strict intent gating can answer safely and fast, reducing tickets and improving self-service.

**Happy path (p95 ≤ 1200 ms).**
1.	User opens the chatbot in the app.
2.	User types a question (e.g., “Can I return an item after 20 days?”).
3.	Intent classification: LLM or lightweight classifier determines if the query is related to ShopLite support (FAQ/policies).
o	If intent is unrelated → chatbot responds: “I’m sorry, I can only answer questions about ShopLite services and policies.”
o	If intent is recognized → proceed to next step.
4.	Retrieval system fetches relevant context from FAQ and policies (RAG).
5.	LLM generates a human-friendly answer grounded in the retrieved context.
6.	Answer is displayed to the user in the chatbot interface.
7.	User can ask follow-up questions; chatbot maintains context.


**Grounding & guardrails.**
- Source of truth: `FAQ.md`, `Policies.md`, and Order-Status API for single-order lookups.
- Retrieval scope: whitelisted docs only; no web search.
- Max context: ≤ 3,000 tokens (question, top 8 chunks).
- Refuse outside scope: intent gate or “I don’t have that info. Here’s Support.”

**Human-in-the-loop.**
- Escalation triggers: user asks or 2 failed answers in a session.
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
