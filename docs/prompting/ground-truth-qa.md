# Ground Truth Q&A  

### Q01: What does a new user need to do to sign up on Shoplite and confirm their email?
**Expected retrieval context:** Document 1: User Registration & Account Management  
**Authoritative answer:** To register, a user enters a **valid email**, creates a **strong password** that follows Shoplite’s security policy, and adds basic profile info (e.g., name and country). After submitting, Shoplite emails a **verification link**. The user must confirm it within **24 hours** or the request expires. A replacement email can be requested. After verification, the account is activated and full features are available.  
**Required keywords in LLM response:** ["valid email", "strong password", "24 hours", "verification link"]  
**Forbidden content:** ["no verification required", "instant approval", "skip email verification"]  

---

### Q02: Which payment options can customers use at checkout on Shoplite?
**Expected retrieval context:** Document 4: Payment Methods and Security  
**Authoritative answer:** Shoplite supports **credit and debit cards** (Visa, MasterCard, American Express), **digital wallets** (PayPal, Apple Pay, Google Pay), and **bank transfers** in supported regions. In some markets, **cash-on-delivery** or mobile money is also available. Payments go through encrypted, PCI DSS–compliant gateways with tokenization to protect card data.  
**Required keywords in LLM response:** ["credit and debit cards", "digital wallets", "bank transfers", "cash-on-delivery"]  
**Forbidden content:** ["cryptocurrency", "unsupported methods", "payment without verification"]  

---

### Q03: Where do I follow my parcel and what order statuses should I expect?
**Expected retrieval context:** Document 5: Order Tracking and Delivery  
**Authoritative answer:** After purchase, buyers get a confirmation email with the order number, ETA, and a link to the **tracking dashboard** in **My Orders** (web and mobile). The standard lifecycle is **Order Confirmed → Processing → Shipped → Out for Delivery → Delivered**, with **notifications** at each step. For third-party couriers, real-time location and delivery windows appear via integrated APIs.  
**Required keywords in LLM response:** ["My Orders", "tracking dashboard", "Order Confirmed → Processing → Shipped → Out for Delivery → Delivered", "notifications"]  
**Forbidden content:** ["no tracking available", "only email updates", "manual tracking required"]  

---

### Q04: What is Shoplite’s return window and how is a refund handled?
**Expected retrieval context:** Document 6: Return and Refund Policies  
**Authoritative answer:** Most items can be returned within a **30-day window** from delivery if they’re in **original condition** (packaging, manuals, accessories). Exclusions (e.g., perishables, digital goods, personalized items) are listed on product pages. Start a return from **My Orders** to obtain a **return authorization number (RAN)** and instructions; ship the item back within **7 days** of approval. Once inspected, refunds go to the original payment method within **5–7 business days** or as wallet credit if needed.  
**Required keywords in LLM response:** ["30-day window", "original condition", "return authorization number", "5–7 business days"]  
**Forbidden content:** ["lifetime returns", "no return limits", "instant refund without inspection"]  

---

### Q05: How does the reviews system work and how are ratings shown?
**Expected retrieval context:** Document 7: Product Reviews and Ratings  
**Authoritative answer:** After delivery, buyers can submit a **star rating (1–5)** and optional comments; media (photos/video) may be added. Only **verified purchase** reviews are allowed. Reviews can be filtered (rating, date, media), and others can mark them **helpful**. Product pages show the **average product rating** and total review count. Automated and human moderation handles spam or inappropriate content.  
**Required keywords in LLM response:** ["star rating (1–5)", "verified purchase", "helpful", "average product rating"]  
**Forbidden content:** ["anonymous reviews allowed", "no moderation", "fake reviews permitted"]  

---

### Q06: I want to sell on Shoplite—what verification is required and how long does it take?
**Expected retrieval context:** Document 8: Seller Account Setup and Management  
**Authoritative answer:** Upgrade a basic account to a seller by submitting **business verification** documents: a **commercial registration certificate**, **proof of address**, and tax/VAT details where applicable. Some regions also require bank information for payouts. Shoplite reviews submissions in **2–3 business days**. Once approved, the Seller Dashboard unlocks for listings, inventory, and analytics.  
**Required keywords in LLM response:** ["business verification", "commercial registration certificate", "proof of address", "2–3 business days"]  
**Forbidden content:** ["instant approval", "no verification required", "personal accounts only"]  

---

### Q07: How are Shoplite’s commissions and extra fees determined?
**Expected retrieval context:** Document 10: Commission and Fee Structure  
**Authoritative answer:** Every sale has a **commission fee** tied to the **product category** (e.g., lower for electronics, higher for apparel). There may be **payment processing fees** (typically 1–3%) and optional promotional costs. The Seller Dashboard provides reports showing commissions, fees, and net payouts, typically disbursed **weekly or bi-weekly**. Returns can adjust payouts; quality-related returns don’t charge sellers refund fees.  
**Required keywords in LLM response:** ["commission fee", "product category", "payment processing fees", "weekly or bi-weekly"]  
**Forbidden content:** ["no commission", "flat fee for all categories", "sellers keep 100% without deductions"]  

---

### Q08: How do I reach Shoplite support, and what are typical response times?
**Expected retrieval context:** Document 11: Customer Support Procedures  
**Authoritative answer:** Support is available via **live chat**, **email**, and a **24/7 help center** in the app and on the web. When submitting a ticket, include your order number, account email, and a brief description. Critical issues (failed payments, lost packages, security problems) are usually handled in **2–4 hours**; most other tickets are addressed within **24 hours**. Progress is visible in the “My Support” dashboard.  
**Required keywords in LLM response:** ["live chat", "email", "24/7 help center", "2–4 hours", "24 hours"]  
**Forbidden content:** ["no customer support", "only phone support", "response times unknown"]  

---

### Q09: Do promo codes apply to the whole cart or specific items, and how are conflicts resolved?
**Expected retrieval context:** Document 3: Shopping Cart and Checkout Process, Document 15: Promotional Codes and Discounts  
**Authoritative answer:** Promotions may apply at the **cart level** or **item level** based on campaign rules. Shoplite enforces a **priority system**: cart-level discounts are evaluated first, then item-level codes. Codes generally **cannot be combined unless explicitly stated**; when multiple options exist, the platform selects the maximum allowed benefit while keeping seller rules intact.  
**Required keywords in LLM response:** ["cart level", "item level", "priority system", "cannot be combined unless explicitly stated"]  
**Forbidden content:** ["promo codes always stack", "promo codes apply randomly", "no priority system"]  

---

### Q10: How can I stop marketing pings but still receive shipping and delivery alerts?
**Expected retrieval context:** Document 12: Mobile App Features, Document 16: Mobile Notifications & Alerts  
**Authoritative answer:** In **Account Settings**, users can disable **promotional notifications** while keeping essential updates—such as **shipping updates** and **delivery reminders**—enabled. Non-urgent promos can be batched, while time-sensitive alerts (e.g., “Out for Delivery” or security notices) are sent immediately and may be mandatory for safety.  
**Required keywords in LLM response:** ["Account Settings", "promotional notifications", "shipping updates", "delivery reminders"]  
**Forbidden content:** ["cannot change notifications", "all or nothing", "no shipping alerts available"]  

---

### Q11: Which safeguards protect my Shoplite account and payment information?
**Expected retrieval context:** Document 1: User Registration & Account Management, Document 4: Payment Methods and Security, Document 14: Security and Privacy Policies  
**Authoritative answer:** Accounts support **two-factor authentication** and lockouts after repeated failures; password resets are email-based. Payments use **PCI DSS–compliant** encrypted gateways with **tokenization**; high-value transactions follow **PSD2/SCA**. Site communications use **TLS 1.3**. Shoplite adheres to **GDPR**/**CCPA**, runs audits and penetration tests, and operates fraud detection and incident response processes.  
**Required keywords in LLM response:** ["two-factor authentication", "PCI DSS–compliant", "tokenization", "TLS 1.3", "GDPR"]  
**Forbidden content:** ["no security measures", "unencrypted transactions", "password only with no extra protection"]  

---

### Q12: My shipment is late or missing—what can I do and when would a refund apply?
**Expected retrieval context:** Document 5: Order Tracking and Delivery, Document 6: Return and Refund Policies  
**Authoritative answer:** Open a **support ticket** from the **tracking dashboard** so Shoplite can coordinate with the seller and courier, typically replying within **48 hours**. If the package is confirmed lost or fails to arrive, a refund is available under the **30-day return and refund policy**. Once approved, refunds post to the original payment method in **5–7 business days** (or wallet credit if necessary).  
**Required keywords in LLM response:** ["tracking dashboard", "support ticket", "30-day return and refund policy", "5–7 business days"]  
**Forbidden content:** ["no refunds for lost packages", "lifetime refunds", "refunds only as store credit"]  

---

### Q13: How do seller KPIs influence search visibility and potential penalties?
**Expected retrieval context:** Document 8: Seller Account Setup and Management, Document 9: Inventory Management for Sellers  
**Authoritative answer:** Shoplite monitors **order defect rate**, **late shipment rate**, and **cancellation rate**. Strong performance improves ranking and recommendations; poor metrics—especially overselling or inaccurate stock—lead to **reduced visibility** and can trigger warnings or **account suspension**. Excessive quality-related returns also prompt reviews. Prompt responses and reliable fulfillment mitigate risk.  
**Required keywords in LLM response:** ["order defect rate", "late shipment rate", "cancellation rate", "reduced visibility", "account suspension"]  
**Forbidden content:** ["no performance monitoring", "all sellers treated equally regardless of quality", "no penalties for poor performance"]  

---

### Q14: I use an external WMS/ERP—how do I keep Shoplite inventory in sync via API?
**Expected retrieval context:** Document 9: Inventory Management for Sellers, Document 13: API Documentation for Developers  
**Authoritative answer:** Integrate using Shoplite’s **RESTful APIs** for **real-time syncing**. Register in the **Developer Portal**, authenticate with **OAuth 2.0**, and update listings through the **/products endpoint** over HTTPS. Default rate limits allow up to **1,000 requests/min**. This prevents overselling and reduces manual updates when connected to your ERP/WMS.  
**Required keywords in LLM response:** ["RESTful APIs", "real-time syncing", "OAuth 2.0", "/products endpoint", "prevent overselling"]  
**Forbidden content:** ["manual updates only", "no API support", "unlimited API calls without limits"]  

---

### Q15: In a mixed-seller cart, how are shipping, discounts, and commissions applied?
**Expected retrieval context:** Document 3: Shopping Cart and Checkout Process, Document 10: Commission and Fee Structure  
**Authoritative answer:** **Multi-seller checkout** lets buyers pay once, but charges remain **seller-specific**. The cart shows **subtotals per seller** and applies appropriate shipping and policies. Promotions may be cart- or item-level per campaign rules. **Commission fees** are computed per seller based on category and reflected in each seller’s financial reports.  
**Required keywords in LLM response:** ["multi-seller checkout", "seller-specific shipping", "subtotals per seller", "commission fees"]  
**Forbidden content:** ["single flat fee for all sellers", "shared seller accounts", "combined commissions across sellers"]  

---

### Q16: If an item is misrepresented, how does Shoplite handle the dispute and refund?
**Expected retrieval context:** Document 6: Return and Refund Policies, Document 17: Dispute Resolution & Buyer Protection  
**Authoritative answer:** File a **dispute** from **My Orders** with evidence (e.g., photos). Shoplite issues a **return authorization number (RAN)** and arranges return shipping (free for defective/incorrect items). The Resolution Team mediates; sellers must reply within **3 business days**. If misrepresentation is confirmed, refunds are issued within **5–10 business days** (original method or wallet credit). Repeated seller disputes trigger reviews and potential penalties.  
**Required keywords in LLM response:** ["dispute", "return authorization number", "3 business days", "5–10 business days refund"]  
**Forbidden content:** ["no refunds for misrepresentation", "buyer has no protection", "instant refund without review"]  

---

### Q17: How does personalization change search ordering, and can I switch it off?
**Expected retrieval context:** Document 2: Product Search and Filtering Features  
**Authoritative answer:** For logged-in users, search may rank results using **browsing history**, **wish lists**, and **past purchases**. If you prefer a neutral view, you can **toggle off** personalization and continue using filters/sorts for discovery.  
**Required keywords in LLM response:** ["browsing history", "wish lists", "past purchases", "toggle off"]  
**Forbidden content:** ["personalization cannot be disabled", "all results are always personalized", "no neutral search option"]  

---

### Q18: What privacy rights do I have, and how can I delete my account and data?
**Expected retrieval context:** Document 1: User Registration & Account Management, Document 14: Security and Privacy Policies  
**Authoritative answer:** Shoplite complies with **GDPR** and **CCPA**, allowing users to access, export, and erase personal data. In **My Account**, you can request **account deletion** or **download activity log** entries. Data is removed following policy and regulatory review. Shoplite uses data only for legitimate purposes (fulfillment, fraud prevention, support) and communicates about incidents and phishing risks transparently.  
**Required keywords in LLM response:** ["GDPR", "CCPA", "My Account", "account deletion", "download activity log"]  
**Forbidden content:** ["data cannot be deleted", "Shoplite sells personal data", "no privacy compliance"]  

---

### Q19: How are reviews authenticated, and what can a seller do about an unfair one?
**Expected retrieval context:** Document 7: Product Reviews and Ratings  
**Authoritative answer:** Reviews are limited to **verified purchasers**. Automated detection and human moderation address spam and abuse. Sellers cannot edit or remove reviews but may **contest reviews** via the **Seller Dashboard** if a post violates guidelines; the **trust and safety team** evaluates and may remove or adjust it when misuse is verified.  
**Required keywords in LLM response:** ["verified purchasers", "contest reviews", "Seller Dashboard", "trust and safety team"]  
**Forbidden content:** ["anonymous reviews allowed", "sellers can freely delete reviews", "no moderation of reviews"]  

---

### Q20: What best practices help a seller avoid overselling and order cancellations?
**Expected retrieval context:** Document 9: Inventory Management for Sellers, Document 8: Seller Account Setup and Management  
**Authoritative answer:** Enable **real-time inventory synchronization** and **low-stock alerts** in the Seller Dashboard. For accuracy at scale, use **API integration** with your ERP/WMS so stock updates are automatic—this helps **prevent overselling**. Keep listings accurate, add stock buffers for high-demand items, and act on alerts promptly. Overselling or inaccurate stock can lead to penalties, including reduced visibility or suspension.  
**Required keywords in LLM response:** ["real-time inventory synchronization", "low-stock alerts", "API integration", "prevent overselling"]  
**Forbidden content:** ["manual updates only with no alerts", "overselling has no consequences", "Shoplite does not track inventory"]  
