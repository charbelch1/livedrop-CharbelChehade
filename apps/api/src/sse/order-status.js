const { getDb } = require('../db');
const { ObjectId } = require('mongodb');
const { perf } = require('../routes/dashboard');

const FLOW = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

module.exports = async function orderStatusSSE(req, res) {
  try {
    const orderId = req.params.id;
    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid order id' } });
    }
    let closed = false;
    perf.sseConnections += 1;

    // Headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const db = getDb();
    const oid = new ObjectId(orderId);
    let order = await db.collection('orders').findOne({ _id: oid });
    if (!order) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: 'Order not found' })}\n\n`);
      res.end();
      perf.sseConnections -= 1;
      return;
    }

    function send(event, data) {
      if (closed) return;
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    // Send initial status immediately
    send('status', { status: order.status, updatedAt: order.updatedAt || order.createdAt });

    let timer;
    const advance = async () => {
      // Reload order in case external changes
      order = await db.collection('orders').findOne({ _id: oid });
      const idx = FLOW.indexOf(order.status);
      if (idx === -1) {
        send('error', { message: 'Invalid status' });
        cleanup();
        return;
      }
      if (order.status === 'DELIVERED') {
        send('done', { status: order.status });
        cleanup();
        return;
      }
      const next = FLOW[idx + 1];
      const delay = idx === 0 ? rand(3000, 5000) : rand(5000, 7000);
      timer = setTimeout(async () => {
        try {
          await db
            .collection('orders')
            .updateOne({ _id: oid }, { $set: { status: next, updatedAt: new Date() } });
          const updated = await db.collection('orders').findOne({ _id: oid });
          send('status', { status: updated.status, updatedAt: updated.updatedAt });
          if (updated.status === 'DELIVERED') {
            send('done', { status: updated.status });
            cleanup();
          } else {
            advance();
          }
        } catch (e) {
          send('error', { message: 'Failed to update status' });
          cleanup();
        }
      }, delay);
    };

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (!closed) res.end();
      closed = true;
      perf.sseConnections -= 1;
    };

    req.on('close', cleanup);
    advance();
  } catch (e) {
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: 'Internal error' })}\n\n`);
    } catch {}
    res.end();
    perf.sseConnections = Math.max(0, perf.sseConnections - 1);
  }
};

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
