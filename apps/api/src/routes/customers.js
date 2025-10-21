const express = require('express');
const { getDb } = require('../db');
const { ObjectId } = require('mongodb');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const email = (req.query.email || '').toString().trim().toLowerCase();
    if (!email) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'email is required' } });
    const db = getDb();
    const customer = await db.collection('customers').findOne({ email });
    if (!customer) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const db = getDb();
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Invalid id' } });
    const customer = await db.collection('customers').findOne({ _id: new ObjectId(id) });
    if (!customer) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } });
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

module.exports = router;
