const express = require('express');
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      tag = '',
      sort = 'relevance',
      page = '1',
      limit = '20',
    } = req.query;

    const db = getDb();
    const q = {};
    if (search) {
      q.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }
    if (tag) q.tags = { $in: [tag] };

    const sortSpec = {};
    if (sort === 'price_asc') sortSpec.price = 1;
    else if (sort === 'price_desc') sortSpec.price = -1;
    else sortSpec._id = -1; // default

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      db.collection('products').find(q).sort(sortSpec).skip(skip).limit(limitNum).toArray(),
      db.collection('products').countDocuments(q),
    ]);
    res.json({ items, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const id = req.params.id
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid id' } });
    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    if (!product) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, price, category, tags = [], imageUrl, stock } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'name required' } });
    if (typeof price !== 'number') return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'price must be number' } });
    const doc = {
      name,
      description: description || '',
      price,
      category: category || 'General',
      tags: Array.isArray(tags) ? tags : [],
      imageUrl: imageUrl || '',
      stock: typeof stock === 'number' ? stock : 0,
      createdAt: new Date(),
    };
    const db = getDb();
    const { insertedId } = await db.collection('products').insertOne(doc);
    res.status(201).json({ _id: insertedId, ...doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

module.exports = router;
