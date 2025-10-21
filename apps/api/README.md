API (Week 5)

Overview
- Express API connected to MongoDB Atlas.
- Real endpoints for customers, products, orders, analytics, and dashboard.
- Server‑Sent Events (SSE) for live order status with auto‑simulation.
- Assistant engine with intents, function calling, and LLM fallback.

 Setup
- Create a MongoDB Atlas M0 cluster and a database user.
- Whitelist 0.0.0.0/0 during development.
- Copy .env.example to .env and fill values:
  - PORT, MONGODB_URI, DB_NAME, CORS_ORIGIN, LLM_BASE_URL
  - Optional: LLM_TIMEOUT_MS (default 6000) to cap LLM call latency

Install & Run
```
cd apps/api
npm install
npm run dev
```

Endpoints
- Customers:
  - GET /api/customers?email=demo@example.com
  - GET /api/customers/:id
- Products:
  - GET /api/products?search=&tag=&sort=&page=&limit=
  - GET /api/products/:id
  - POST /api/products
- Orders:
  - POST /api/orders
  - GET /api/orders/:id
  - GET /api/orders?customerId=:customerId
  - GET /api/orders/:id/stream (SSE)
- Analytics:
  - GET /api/analytics/daily-revenue?from=YYYY-MM-DD&to=YYYY-MM-DD
  - GET /api/analytics/dashboard-metrics
- Dashboard:
  - GET /api/dashboard/business-metrics
  - GET /api/dashboard/performance
  - GET /api/dashboard/assistant-stats
- Assistant:
  - POST /api/assistant/message { message, email? }

 Notes
- The SSE endpoint auto‑progresses statuses PENDING → PROCESSING → SHIPPED → DELIVERED and updates the DB at each step.
- Analytics uses MongoDB aggregation (no JS reduce loops).
- LLM endpoint assumed at `${LLM_BASE_URL}/generate` from Week 3 Colab. A timeout is applied via `LLM_TIMEOUT_MS` to avoid long waits.


Environment
- See .env.example. Required: PORT, MONGODB_URI, DB_NAME, CORS_ORIGIN (comma-separated origins), optional LLM_BASE_URL.
- Documented test user: demo@example.com (seeded via src/seed.js).
