# AI Capability Map — ShopLite

> **Spine.** ShopLite (~10k SKUs • ~20k sessions/day)  
> **Targets.** Typeahead `p95 ≤ 300 ms` • Support assistant `p95 ≤ 1200 ms`

---

## Selected Pilots (This Sprint)

| Capability | Intent (user) | Inputs (this sprint) | Risk* | p95 (ms)** | Est. cost / action | Fallback |
|---|---|---:|---:|---:|---:|---|
| **Support assistant (RAG + order status)** | “Answer my question / check my order.” | FAQ / Policies MD, Order-Status API | 2 | 1200 | **$0.09–$0.11** | Hand-off to human; canned replies |
| **Semantic typeahead (search suggest)** | “Help me find products faster.” | SKU titles, tags, categories; Redis | 2 | 300 | **$0.018–$0.022** | Prefix-only keyword suggest |

<details>
<summary>Details</summary>

- **Support assistant**
  - **Grounding:** Strictly FAQ / Policies + live order status JSON; no open web.
  - **Scope:** FAQ, returns, shipping, “where is my order”.
  - **LLM:** 8B Instruct; 900–1000 tokens in (incl. 3–5 chunks), 200–250 out.
  - **Caching:** FAQ answers by (normalized Q + policy hash) for 24h.
  - **Escalation:** Low confidence, policy gap, toxic/PII, 2+ failed turns.

- **Typeahead**
  - **Flow:** Prefix candidates (Redis) → light rerank → blend with business rules.
  - **LLM path:** ~220 in / ~45 out for tail queries only; head = cache/prefix.
  - **Prod option:** Distilled cross-encoder (no LLM) for 80%+ cost drop.
</details>

---

## Near-Term Backlog

| Capability | Intent (user) | Inputs (this sprint) | Risk* | p95 (ms)** | Cost / action | Fallback |
|---|---|---|---:|---:|---:|---|
| **Return-reason classifier** | Cleaner flows; policy routing | Seed reasons, policy text | 3 | 250 | $0.003–$0.006 | Default generic flow |
| **PDP Q&A (specs/reviews RAG)** | Reduce drop-offs on PDP | Specs, Q&A snippets | 3 | 900 | $0.05–$0.10 | Link to specs section |
| **Catalog enrichment (batch)** | Better facets/filters | Titles, specs CSV | 4 | n/a | batch budget | No enrichment |

---

## Why these two

Support assistant and semantic typeahead are the lowest-risk, highest-leverage touchpoints using sources of truth we already have. Support should **deflect simple tickets** and improve CSAT for FAQ + order status. Typeahead should **lift search success and product discovery**. Both meet p95 targets with lean retrieval, caching, and safe fallbacks.

---

### Legends & Notes
- *Risk:* 1 (very low) → 5 (high).  
- **p95 (ms)** measured **end-to-end** for the user action (network + compute).  
- **Est. cost / action**: realistic with RAG where applicable (see `/docs/ai-first/cost-model.md`).  
- “Fallback” = behavior when model, retrieval, or upstream APIs fail.

