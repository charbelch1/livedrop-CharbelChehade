const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// In-memory metrics (dev-only; reset on server restart)
const perf = {
  sseConnections: 0,
  requestCount: 0,
  failedRequests: 0,
  latencyMsTotal: 0,
  latencySamples: 0,
  startedAt: Date.now(),
};

router.get('/business-metrics', async (_req, res) => {
  try {
    const db = getDb();
    const [revenueAgg, orders, customers, byStatus] = await Promise.all([
      db.collection('orders').aggregate([{ $group: { _id: null, revenue: { $sum: '$total' } } }]).toArray(),
      db.collection('orders').countDocuments(),
      db.collection('customers').countDocuments(),
      db
        .collection('orders')
        .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
        .toArray(),
    ]);
    const revenue = revenueAgg[0]?.revenue || 0;
    const avgOrderValueAgg = await db
      .collection('orders')
      .aggregate([{ $group: { _id: null, aov: { $avg: '$total' } } }])
      .toArray();
    res.json({
      revenue,
      orders,
      customers,
      avgOrderValue: avgOrderValueAgg[0]?.aov || 0,
      ordersByStatus: Object.fromEntries((byStatus || []).map(r => [r._id || 'UNKNOWN', r.count])),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

router.get('/performance', async (_req, res) => {
  const avgLatencyMs = perf.latencySamples > 0 ? Math.round(perf.latencyMsTotal / perf.latencySamples) : 0;
  let dbOk = false;
  try {
    const db = getDb();
    await db.command({ ping: 1 });
    dbOk = true;
  } catch {}
  let llm = {};
  try { llm = require('../assistant/function-registry').getLlmStatus(); } catch {}
  res.json({
    sseConnections: perf.sseConnections,
    requestCount: perf.requestCount,
    failedRequests: perf.failedRequests,
    avgLatencyMs,
    uptimeSeconds: Math.floor((Date.now() - perf.startedAt) / 1000),
    lastUpdateTs: new Date().toISOString(),
    db: { ok: dbOk },
    llm,
  });
});

// Assistant stats stored in memory for demo
const assistantStats = {
  intents: {},
  functionCalls: {},
  queries: 0,
  timings: {
    intentResponseMs: {}, // intent -> { count, totalMs }
    llmMsByIntent: {},    // intent -> { count, totalMs }
  },
};

router.get('/assistant-stats', (_req, res) => {
  // Prepare derived metrics
  const distributions = assistantStats.intents;
  const responseTimes = {};
  for (const [intent, v] of Object.entries(assistantStats.timings.intentResponseMs)) {
    responseTimes[intent] = {
      count: v.count || 0,
      avgMs: v.count ? Math.round((v.totalMs || 0) / v.count) : 0,
    };
  }
  const llmTimes = {};
  for (const [intent, v] of Object.entries(assistantStats.timings.llmMsByIntent)) {
    llmTimes[intent] = {
      count: v.count || 0,
      avgMs: v.count ? Math.round((v.totalMs || 0) / v.count) : 0,
    };
  }
  res.json({
    queries: assistantStats.queries,
    intents: distributions,
    functionCalls: assistantStats.functionCalls,
    avgResponseMsByIntent: responseTimes,
    llmLatencyByIntent: llmTimes,
  });
});

module.exports = { router, perf, assistantStats };
