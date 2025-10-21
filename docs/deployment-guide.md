Week 5 Deployment Guide

Overview
- Backend: Render (Free Web Service) running apps/api
- Database: MongoDB Atlas (M0)
- Frontend: Vercel running apps/storefront
- LLM: Week 3 Colab notebook exposed via ngrok with added /generate endpoint

1) MongoDB Atlas
- Create M0 cluster and a DB user.
- Network Access: allow 0.0.0.0/0 for dev.
- Get connection string (SRV) and set MONGODB_URI.

2) Seed Data
- Option A: create a quick seed script (coming soon) or insert via Compass.
- Required: 10–15 customers (document one test user in README), 20–30 products, 15–20 orders.

3) Backend on Render
- New Web Service → Connect GitHub repo → root directory: apps/api
- Build Command: npm install
- Start Command: npm start
- Environment Variables:
  - PORT = 8080
  - MONGODB_URI = your SRV URI
  - DB_NAME = shoplite
  - CORS_ORIGIN = * (or your Vercel domain)
  - LLM_BASE_URL = https://<your-ngrok-subdomain>.ngrok.io

4) Frontend on Vercel
- New Project → apps/storefront
- Framework: Vite React
- Env Vars:
  - VITE_API_BASE_URL = https://<your-render-service>.onrender.com

5) LLM Colab
- Open notebooks/llm-deployment.ipynb in Colab.
- Add a new /generate route alongside /chat:
  - Input: { prompt: string }
  - Output: { output: string }
- Start ngrok and copy base URL to LLM_BASE_URL.

6) Verify
- API health: GET /health
- Customers lookup: GET /api/customers?email=demo@example.com
- SSE: open OrderTracking with an orderId and watch status progress.
- Assistant: ask a policy question; expect [Qxx] citation when matched.

