# Week 5 Deployment Guide

## 📘 Overview
- **Backend:** Render (Free tier) running `apps/api`
- **Database:** MongoDB Atlas (M0 free tier)
- **Frontend:** Vercel (Free) running `apps/storefront`
- **LLM:** Week 3 Colab notebook exposed via ngrok with a new `/generate` endpoint

---

## 🧩 Prerequisites
- GitHub repository connected to your cloud providers (Render / Vercel)
- MongoDB Atlas account (M0)
- ngrok account (free) for exposing your Colab endpoint

---

## 1️⃣ MongoDB Atlas (Required)
1. Create an **M0 cluster** and a **database user**.  
2. **Network Access:** allow `0.0.0.0/0` (for development).  
3. Get your connection string (SRV) and set it as `MONGODB_URI`.  
4. Default DB name: `shoplite` (can override with `DB_NAME`).

---

## 2️⃣ Seed Data (Required)
1. From `apps/api`, copy `.env.example` → `.env` and fill:
   ```env
   MONGODB_URI=<your MongoDB SRV URI>
   DB_NAME=shoplite
   ```
2. Install and seed:
   ```bash
   cd apps/api
   npm install
   npm run seed
   ```
3. **Minimum data required for grading:**
   - Customers: 10–15 (include one test user, e.g. `demo@example.com`)
   - Products: 20–30
   - Orders: 15–20

---

## 3️⃣ Backend Deployment (Render Recommended)
You can use the provided `render.yaml` (at the repo root) or set up manually.

### Manual Setup
- **Service type:** Web Service  
- **Root directory:** `apps/api`  
- **Build Command:** `npm ci` (or `npm install`)  
- **Start Command:** `npm start`  
- **Health Check Path:** `/health`  

### Environment Variables (Render → Dashboard → Environment)
```env
PORT=8080
MONGODB_URI=<your Atlas SRV URI>
DB_NAME=shoplite
CORS_ORIGIN=https://livedrop-charbel-chehade.vercel.app/
# or use "*" during local development
```

---

## 4️⃣ Frontend Deployment (Vercel)
1. **New Project** → Import the GitHub repo  
2. Set **Root Directory** to `apps/storefront`  
3. **Framework Preset:** `Vite`  
4. **Build Command:**
   ```bash
   npm run build
   ```
5. **Output Directory:**
   ```
   dist
   ```
6. **Environment Variables (Vercel → Settings → Environment):**
   ```env
   VITE_API_BASE_URL=https://livedrop-charbelchehade.onrender.com
   ```

> The app uses **hash-based routing**, so **no rewrites are needed**.

---

## 5️⃣ LLM Endpoint (Colab + ngrok)

### a. Setup
Open your **Week 3 Colab notebook** (e.g. `notebooks/llm-deployment.ipynb`) and add a **new endpoint** for Week 5.

### b. Example Flask Endpoint
```python
# New endpoint (do not modify your Week 3 RAG endpoints)
@app.post("/generate")
def generate_endpoint():
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt") or data.get("question") or ""
    if not prompt:
        return jsonify({"error": "Missing 'prompt'"}), 400

    max_new_tokens = int(data.get("max_new_tokens", 160))
    temperature = data.get("temperature", None)
    try:
        temperature = float(temperature) if temperature is not None else 0.3
    except Exception:
        temperature = 0.3

    t0 = time.time()
    text = generate_response(
        prompt,
        max_new_tokens=max_new_tokens,
        temperature=temperature if (temperature and temperature > 0) else 0.3
    )
    return jsonify({"text": text, "latency_s": round(time.time() - t0, 3)}), 200
```

### c. Expose via ngrok
1. Run ngrok in Colab (after starting Flask):
   ```bash
   !ngrok http 5000
   ```
2. Copy the **base URL** (e.g., `https://abcd1234.ngrok.io`).

3. In your **Render backend** environment variables:
   ```env
   LLM_BASE_URL=https://abcd1234.ngrok.io
   ```

> The backend calls `POST <LLM_BASE_URL>/generate`.  
> It accepts `{ text }` or `{ output }` in the response, but the assignment requires `{ text }`.

---

## 6️⃣ Environment Variables (Summary)

| Service | Variable | Example / Notes |
|---|---|---|
| **Backend** | `MONGODB_URI` | MongoDB Atlas SRV |
|  | `PORT` | 8080 (default) |
|  | `DB_NAME` | shoplite |
|  | `CORS_ORIGIN` | Your frontend URL |
| **Frontend** | `VITE_API_BASE_URL` | Backend API URL |
| **Backend (LLM)** | `LLM_BASE_URL` | ngrok Colab URL |

---

## 7️⃣ Run Locally (End-to-End)

### 🖥️ Backend
```bash
cd apps/api
npm install
cp .env.example .env
# fill MONGODB_URI, optionally DB_NAME and CORS_ORIGIN
npm run seed
npm run dev  # or npm start
```
Check health endpoint:  
👉 http://localhost:8080/health

---

### 💻 Frontend
```bash
cd apps/storefront
npm install
cp .env.example .env
# set VITE_API_BASE_URL=http://localhost:8080
npm run dev
```
Open the printed localhost URL.

---

### 🤖 LLM
1. Run Colab notebook  
2. Ensure `/generate` endpoint is added  
3. Start ngrok and copy its public URL  
4. Set `LLM_BASE_URL` in `apps/api/.env`  
5. Restart backend

---

✅ **Everything should now work end-to-end:**  
Frontend ↔ Backend ↔ MongoDB ↔ Colab LLM endpoint (via ngrok)
