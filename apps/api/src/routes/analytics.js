const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/daily-revenue', async (req, res) => {
  try {
    const { from, to } = req.query;
    const db = getDb();
    const match = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from.toString());
      if (to) match.createdAt.$lte = new Date(to.toString());
    }
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            y: { $year: '$createdAt' },
            m: { $month: '$createdAt' },
            d: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: '$_id.y',
              month: '$_id.m',
              day: '$_id.d',
            },
          },
          revenue: 1,
          orderCount: 1,
        },
      },
      { $sort: { date: 1 } },
    ];
    const rows = await db.collection('orders').aggregate(pipeline).toArray();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

router.get('/dashboard-metrics', async (req, res) => {
  try {
    const db = getDb();
    const [totalRevenue, orderCount, avgOrderValue] = await Promise.all([
      db.collection('orders').aggregate([{ $group: { _id: null, v: { $sum: '$total' } } }]).toArray(),
      db.collection('orders').countDocuments(),
      db.collection('orders').aggregate([{ $group: { _id: null, v: { $avg: '$total' } } }]).toArray(),
    ]);
    res.json({
      totalRevenue: totalRevenue[0]?.v || 0,
      orders: orderCount || 0,
      avgOrderValue: avgOrderValue[0]?.v || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

module.exports = router;

