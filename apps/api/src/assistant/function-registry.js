const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { getDb } = require('../db');

let GROUND_TRUTH = [];
// Resolve docs/ground-truth.json robustly regardless of CWD
const gtCandidates = [
  path.join(process.cwd(), 'docs', 'ground-truth.json'),
  path.join(process.cwd(), '..', '..', 'docs', 'ground-truth.json'),
  path.join(__dirname, '../../../..', 'docs', 'ground-truth.json'),
];
for (const p of gtCandidates) {
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      GROUND_TRUTH = JSON.parse(raw);
      break;
    }
  } catch (e) {
    // ignore
  }
}
if (!GROUND_TRUTH.length) {
  console.warn('[assistant] ground-truth.json not found in candidates:', gtCandidates);
}

async function getOrderStatus({ orderId }) {
  const db = getDb();
  const { ObjectId } = require('mongodb');
  try {
    const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
    if (!order) return { found: false };
    return {
      found: true,
      status: order.status,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      updatedAt: order.updatedAt || order.createdAt,
    };
  } catch {
    return { found: false };
  }
}

async function searchProducts({ query }) {
  const db = getDb();
  const items = await db
    .collection('products')
    .find({ $or: [{ name: { $regex: query, $options: 'i' } }, { tags: { $elemMatch: { $regex: query, $options: 'i' } } }] })
    .limit(5)
    .toArray();
  return items;
}

function answerFromGroundTruth({ message, k = 3 }) {
  // Simple scoring by keyword overlap across question and answer
  const tokens = String(message || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const scored = GROUND_TRUTH.map((item) => {
    const hay = `${String(item.question || '').toLowerCase()} ${String(item.answer || '').toLowerCase()}`;
    const score = tokens.reduce((s, t) => (hay.includes(t) ? s + 1 : s), 0);
    return { item, score };
  }).sort((a, b) => b.score - a.score);
  const top = scored.filter((x) => x.score > 0).slice(0, k).map(({ item, score }) => ({ id: item.id, question: item.question, answer: item.answer, score }));
  const best = top[0];
  if (!best || best.score < 2) return { confidence: best?.score || 0, answer: null, top };
  return { confidence: best.score, answer: `${best.answer} [${best.id}]`, top };
}

let LLM_BACKOFF_UNTIL = 0;
let LLM_WARNED = false;

async function callLLM({ prompt }) {
  const base = process.env.LLM_BASE_URL;
  if (!base) return { ok: false, output: '' };
  if (Date.now() < LLM_BACKOFF_UNTIL) return { ok: false, output: '' };
  try {
    const url = `${base.replace(/\/$/, '')}/generate`;
    const headers = { 'ngrok-skip-browser-warning': '1' };
    // Optional auth headers if the ngrok/Colab endpoint is protected
    if (process.env.LLM_BASIC_AUTH) {
      const token = Buffer.from(process.env.LLM_BASIC_AUTH, 'utf8').toString('base64');
      headers['Authorization'] = `Basic ${token}`;
    } else if (process.env.LLM_BEARER) {
      headers['Authorization'] = `Bearer ${process.env.LLM_BEARER}`;
    }
    if (process.env.LLM_API_KEY) headers['x-api-key'] = process.env.LLM_API_KEY;

    const timeoutMs = Math.max(1000, parseInt(process.env.LLM_TIMEOUT_MS || '6000', 10));
    const resp = await axios.post(url, { prompt }, { headers, timeout: timeoutMs });
    // success: clear backoff/warn flag
    LLM_BACKOFF_UNTIL = 0; LLM_WARNED = false;
    return { ok: true, output: resp.data?.output || resp.data?.text || JSON.stringify(resp.data) };
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;
    // back off for 60s to avoid noisy logs when endpoint is offline
    LLM_BACKOFF_UNTIL = Date.now() + 60_000;
    if (!LLM_WARNED) {
      console.warn('[assistant] LLM offline; backing off 60s', { url: process.env.LLM_BASE_URL, status, preview: typeof data === 'string' ? String(data).slice(0, 120) : data });
      LLM_WARNED = true;
    }
    return { ok: false, output: '' };
  }
}

function getLlmStatus() {
  const configured = !!process.env.LLM_BASE_URL;
  const online = configured && Date.now() >= LLM_BACKOFF_UNTIL;
  return { configured, online, backoffUntil: LLM_BACKOFF_UNTIL || 0 };
}

module.exports = { getOrderStatus, searchProducts, answerFromGroundTruth, callLLM, getLlmStatus };
