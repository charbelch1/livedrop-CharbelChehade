const express = require('express');
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { customerId, items } = req.body || {};
    if (!customerId) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'customerId required' } });
    if (!ObjectId.isValid(customerId)) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'customerId must be a valid ObjectId' } });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'items[] required' } });
    const total = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
    const order = {
      customerId: new ObjectId(customerId),
      items: items.map((it) => {
        if (it.productId && !ObjectId.isValid(it.productId)) {
          throw new Error('INVALID_PRODUCT_ID');
        }
        return {
          productId: it.productId ? new ObjectId(it.productId) : undefined,
          name: it.name,
          price: it.price,
          quantity: it.quantity || 1,
        };
      }),
      total,
      status: 'PENDING',
      carrier: 'DHL',
      estimatedDelivery: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const db = getDb();
    const { insertedId } = await db.collection('orders').insertOne(order);
    res.status(201).json({ _id: insertedId, ...order });
  } catch (err) {
    if (err && err.message === 'INVALID_PRODUCT_ID') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'productId must be a valid ObjectId' } });
    }
    console.error('orders.post error', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const order = await db.collection('orders').findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

router.get('/', async (req, res) => {
  try {
    const { customerId } = req.query;
    const db = getDb();
    const q = {};
    if (customerId) q.customerId = new ObjectId(customerId.toString());
    const orders = await db.collection('orders').find(q).sort({ createdAt: -1 }).toArray();
    res.json({ items: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

module.exports = router;
