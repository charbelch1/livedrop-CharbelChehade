# Cost Model

We choose **Llama 3.1 8B Instruct** for AI-Enhanced Search (low-risk rerank, cost-efficient) and **GPT-4o-mini** for the Support Chatbot (higher quality needed on policy answers). Prices align with the assignment defaults.

---

## Assumptions

### AI-Enhanced Search (Typeahead)
- **Model:** Llama 3.1 8B Instruct at **$0.05/1K prompt**, **$0.20/1K completion**
- **Avg tokens in:** 250 (parsed query + compact product snippets for top-K)
- **Avg tokens out:** 60 (lightweight rerank/meta)
- **Requests/day:** 50,000
- **Cache hit rate:** 70%

### Support Chatbot
- **Model:** GPT-4o-mini at **$0.15/1K prompt**, **$0.60/1K completion**
- **Avg tokens in:** 600 (question + retrieved FAQ/policy chunks)
- **Avg tokens out:** 150 (grounded answer)
- **Requests/day:** 1,000
- **Cache hit rate:** 30%

> Notes  
> - Search invokes the LLM only on ambiguous queries (~30%). We keep the template simple and conservatively budget as if every miss uses the LLM; real costs will be lower in production.  
> - Embedding generation is amortized offline and excluded here.

---

## Calculation

**Cost/action** = (tokens_in / 1000 × prompt_price) + (tokens_out / 1000 × completion_price)  
**Daily cost** = Cost/action × Requests/day × (1 − cache_hit_rate)

---

## Results

### AI-Enhanced Search (Typeahead, Llama 3.1 8B)
- Cost/action = (250/1000 × 0.05) + (60/1000 × 0.20) = **$0.0245**
- Daily = 0.0245 × 50,000 × (1 − 0.70) = **$367.50**

### Support Chatbot (GPT-4o-mini)
- Cost/action = (600/1000 × 0.15) + (150/1000 × 0.60) = **$0.1800**
- Daily = 0.1800 × 1,000 × (1 − 0.30) = **$126.00**

**Total estimated LLM spend/day ≈ $493.50**  
(Real-world likely lower due to selective reranking and response caching.)

---

## Cost levers if over budget

- Reduce RAG context to ≤ 400 tokens for common policies; prefer retrieval-augmented templates over freeform answers.
- Use **Llama 3.1 8B** for low-risk chatbot paths (shipping times, store hours), keep GPT-4o-mini only for complex policy logic.
- Increase typeahead cache window for top 1k queries; pre-compute/rank bundles for peak hours.
- Tune reranker gating (trigger only when lexical+ANN disagreement > threshold).
