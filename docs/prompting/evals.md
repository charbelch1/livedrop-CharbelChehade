# RAG System Evaluation

## Retrieval Quality Tests (10 tests)
| Test ID | Question | Expected Documents | Pass Criteria |
|---------|----------|-------------------|---------------|
| R01 | What does a new user need to do to sign up on Shoplite and confirm their email? | User Registration & Account Management | Retrieved docs contain Registration doc with verification link and confirmation window. |
| R02 | Which payment options can customers use at checkout on Shoplite? | Payment Methods and Security | Retrieved docs list accepted methods (cards, wallets, transfers, COD if available). |
| R03 | Where do I follow my parcel and what order statuses should I expect? | Order Tracking and Delivery | Retrieved docs describe tracking dashboard and statuses Confirmed → Delivered. |
| R04 | What is Shoplite’s return window and how is a refund handled? | Return and Refund Policies | Retrieved docs mention return window, RAN, and refund timeline. |
| R05 | How does the reviews system work and how are ratings shown? | Product Reviews and Ratings | Retrieved docs describe 1–5 star ratings, verified purchase, helpful votes. |
| R06 | I want to sell on Shoplite—what verification is required and how long does it take? | Seller Account Setup and Management | Retrieved docs include business verification requirements and approval timeline. |
| R07 | How are Shoplite’s commissions and extra fees determined? | Commission and Fee Structure | Retrieved docs explain category-based commission and payout schedule. |
| R08 | How do I reach Shoplite support, and what are typical response times? | Customer Support Procedures | Retrieved docs include live chat, email, help center, and SLA times. |
| R09 | I use an external WMS/ERP—how do I keep Shoplite inventory in sync via API? | API Documentation; Inventory Management for Sellers | Retrieved docs show API endpoints and syncing details. |
| R10 | In a mixed-seller cart, how are shipping, discounts, and commissions applied? | Shopping Cart and Checkout Process; Commission and Fee Structure | Retrieved docs combine both docs explaining multi-seller cart rules. |

## Response Quality Tests (15 tests)  
| Test ID | Question | Required Keywords | Forbidden Terms | Expected Behavior |
|---------|----------|-------------------|-----------------|-------------------|
| Q01 | What does a new user need to do to sign up on Shoplite and confirm their email? | ["valid email", "strong password", "24 hours", "verification link"] | ["no verification required", "instant approval"] | Direct step-by-step answer with Registration doc citation. |
| Q02 | Which payment options can customers use at checkout on Shoplite? | ["credit and debit cards", "digital wallets", "bank transfers", "cash-on-delivery"] | ["cryptocurrency", "unsupported methods"] | Enumerates options and cites Payments doc. |
| Q03 | Where do I follow my parcel and what order statuses should I expect? | ["My Orders", "tracking dashboard", "Order Confirmed", "Processing", "Shipped", "Delivered"] | ["no tracking available", "manual tracking only"] | Explains status flow with Tracking doc citation. |
| Q04 | What is Shoplite’s return window and how is a refund handled? | ["30-day window", "original condition", "return authorization number", "5–7 business days"] | ["lifetime returns", "instant refund"] | Explains return process with Returns doc citation. |
| Q05 | How does the reviews system work and how are ratings shown? | ["star rating", "verified purchase", "helpful votes", "average rating"] | ["fake reviews permitted", "no moderation"] | Describes mechanics clearly with Reviews doc citation. |
| Q06 | I want to sell on Shoplite—what verification is required and how long does it take? | ["business verification", "commercial registration", "proof of address", "2–4 business days"] | ["instant approval", "no verification"] | Lists requirements and cites Seller Setup doc. |
| Q07 | How are Shoplite’s commissions and extra fees determined? | ["commission fee", "product category", "payout", "processing fee"] | ["no commission", "flat fee for all categories"] | Explains commission logic with Commissions doc citation. |
| Q08 | How do I reach Shoplite support, and what are typical response times? | ["live chat", "email", "24/7 help center", "2–4 hours"] | ["no support", "unknown response time"] | Provides support channels with Support doc citation. |
| Q09 | Do promo codes apply to the whole cart or specific items, and how are conflicts resolved? | ["cart level", "item level", "priority system", "cannot be combined"] | ["promo codes always stack"] | Explains rules and cites Promotions doc. |
| Q10 | How can I stop marketing pings but still receive shipping and delivery alerts? | ["Account Settings", "promotional notifications", "shipping updates", "delivery reminders"] | ["cannot change notifications", "all or nothing"] | Explains notification settings with Notifications doc citation. |
| Q11 | Which safeguards protect my Shoplite account and payment information? | ["two-factor authentication", "PCI DSS", "tokenization", "TLS 1.3", "GDPR"] | ["no security measures", "unencrypted"] | Lists safeguards citing Security/Privacy docs. |
| Q12 | My shipment is late or missing—what can I do and when would a refund apply? | ["tracking dashboard", "support ticket", "refund policy", "5–7 business days"] | ["no refunds", "lifetime refunds only"] | Explains next steps with Tracking + Returns docs citation. |
| Q13 | How do seller KPIs influence search visibility and penalties? | ["order defect rate", "late shipment rate", "cancellation rate", "account suspension"] | ["no monitoring", "equal visibility for all"] | Explains KPI impact citing Seller/Inventory docs. |
| Q14 | I use an external WMS/ERP—how do I keep Shoplite inventory in sync via API? | ["RESTful APIs", "real-time syncing", "OAuth 2.0", "/products endpoint"] | ["manual updates only", "no API support"] | Integration steps citing API + Inventory docs. |
| Q15 | What privacy rights do I have, and how can I delete my account and data? | ["GDPR", "CCPA", "account deletion", "download activity log"] | ["data cannot be deleted", "Shoplite sells data"] | Explains privacy rights citing Privacy + Account docs. |

## Prompt Routing Tests (5 tests)
| Test ID | Scenario | Expected Response Type |
|---------|----------|----------------------|
| E01 | Retrieval returns 0 documents (e.g., "Do you ship to the Moon?") | Use refusal_no_context prompt; safe refusal with brief explanation |
| E02 | Retrieval returns exactly 1 relevant document (e.g., "How do I verify my email?") | Use base_retrieval_prompt; answer grounded in that single doc with citation |
| E03 | Retrieval returns 2 or more relevant documents (e.g., "In a mixed-seller cart, how are commissions and shipping calculated?") | Use multi_document_synthesis; integrate multiple docs and cite each |
| E04 | Retrieval returns docs with partial relevance (e.g., only general info but missing key details) | Assistant should clarify limitations, answer cautiously, and cite the partial doc without hallucination |
| E05 | Retrieval returns overlapping docs (similar content from multiple places, e.g., two versions of return policy) | Use multi_document_synthesis but highlight possible duplication or version differences clearly |

