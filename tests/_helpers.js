// Simple in-memory fake DB and test helpers

function hexId(i = 0) {
  // 24-char lowercase hex string
  const base = 'abcdef0123456789';
  let s = '';
  for (let k = 0; k < 24; k++) s += base[(i + k) % base.length];
  return s;
}

function createStore() {
  const products = [
    { _id: hexId(1), name: 'Wireless Earbuds', description: 'ANC', price: 79, category: 'Audio', tags: ['earbuds','audio'], imageUrl: '', stock: 20, createdAt: new Date() },
    { _id: hexId(2), name: '4K Monitor', description: '27 inch', price: 299, category: 'Displays', tags: ['monitor'], imageUrl: '', stock: 10, createdAt: new Date() },
  ];
  const orders = [];
  const customers = [ { _id: hexId(9), email: 'demo@example.com', name: 'Demo User', createdAt: new Date() } ];
  return { products, orders, customers };
}

function toHex(id) {
  if (!id) return id;
  if (typeof id.toHexString === 'function') return id.toHexString();
  if (typeof id === 'object' && id._id && typeof id._id.toHexString === 'function') return id._id.toHexString();
  return String(id);
}

function makeDb(store) {
  function collection(name) {
    const arr = store[name] || [];
    return {
      find(query = {}) {
        const data = arr.filter((doc) => matchQuery(doc, query));
        const api = {
          sort(_spec) { return api; },
          skip(_n) { return api; },
          limit(_n) { return api; },
          toArray() { return Promise.resolve([...data]); },
        };
        return api;
      },
      findOne(query = {}) {
        const found = arr.find((doc) => matchQuery(doc, query));
        return Promise.resolve(found || null);
      },
      countDocuments(query = {}) {
        return Promise.resolve(arr.filter((doc) => matchQuery(doc, query)).length);
      },
      insertOne(doc) {
        const _id = hexId(Math.floor(Math.random() * 100));
        const full = { _id, ...doc };
        arr.push(full);
        return Promise.resolve({ insertedId: _id });
      },
      updateOne(filter, update) {
        const idx = arr.findIndex((doc) => matchQuery(doc, filter));
        if (idx >= 0) {
          const $set = update?.$set || {};
          arr[idx] = { ...arr[idx], ...$set };
        }
        return Promise.resolve({ matchedCount: idx >= 0 ? 1 : 0, modifiedCount: idx >= 0 ? 1 : 0 });
      },
      aggregate(pipeline = []) {
        // Minimal handlers for analytics endpoints
        if (name === 'orders') {
          // daily-revenue
          const stage1 = pipeline[0] || {};
          let rows = store.orders.slice();
          const match = stage1.$match || {};
          if (match.createdAt) {
            const ge = match.createdAt.$gte ? new Date(match.createdAt.$gte) : null;
            const le = match.createdAt.$lte ? new Date(match.createdAt.$lte) : null;
            rows = rows.filter((o) => (!ge || o.createdAt >= ge) && (!le || o.createdAt <= le));
          }
          if (pipeline.some((s) => s.$group && s.$group._id && s.$group._id.y)) {
            // group by date
            const by = new Map();
            for (const o of rows) {
              const key = o.createdAt.toISOString().slice(0, 10);
              const prev = by.get(key) || { revenue: 0, orderCount: 0 };
              prev.revenue += Number(o.total || 0);
              prev.orderCount += 1;
              by.set(key, prev);
            }
            const out = Array.from(by.entries()).map(([k, v]) => ({ date: new Date(k), revenue: v.revenue, orderCount: v.orderCount }));
            out.sort((a, b) => a.date - b.date);
            return { toArray: () => Promise.resolve(out) };
          }
          // simple group sums
          if (pipeline.some((s) => s.$group && s.$group.revenue)) {
            const sum = rows.reduce((s, o) => s + Number(o.total || 0), 0);
            return { toArray: () => Promise.resolve([{ _id: null, revenue: sum }]) };
          }
          if (pipeline.some((s) => s.$group && s.$group.aov)) {
            const aov = rows.length ? rows.reduce((s, o) => s + Number(o.total || 0), 0) / rows.length : 0;
            return { toArray: () => Promise.resolve([{ _id: null, aov }]) };
          }
          if (pipeline.some((s) => s.$group && s.$group.v)) {
            const sum = rows.reduce((s, o) => s + Number(o.total || 0), 0);
            return { toArray: () => Promise.resolve([{ _id: null, v: sum }]) };
          }
          if (pipeline.some((s) => s.$group && s.$group.count)) {
            const byStatus = rows.reduce((m, o) => { m[o.status] = (m[o.status] || 0) + 1; return m; }, {});
            const arr = Object.entries(byStatus).map(([k, v]) => ({ _id: k, count: v }));
            return { toArray: () => Promise.resolve(arr) };
          }
        }
        return { toArray: () => Promise.resolve([]) };
      },
    };
  }
  return { collection };
}

function matchQuery(doc, query) {
  for (const [k, v] of Object.entries(query)) {
    if (k === '$or') {
      const ok = v.some((sub) => matchQuery(doc, sub));
      if (!ok) return false;
      continue;
    }
    if (typeof v === 'object' && v !== null && v.$regex) {
      const re = new RegExp(v.$regex, v.$options || '');
      const val = String(doc[k] || '');
      if (!re.test(val)) return false;
      continue;
    }
    if (k === '_id') {
      if (toHex(doc._id) !== toHex(v)) return false;
      continue;
    }
    if (k === 'tags' && v?.$in) {
      const set = new Set(doc.tags || []);
      if (!v.$in.some((t) => set.has(t))) return false;
      continue;
    }
    if (typeof v === 'object' && !(v instanceof Date)) {
      // unsupported operators → basic equality fallback
      if (String(doc[k]) !== String(v)) return false;
      continue;
    }
    if (String(doc[k]) !== String(v)) return false;
  }
  return true;
}

function makeDbModule(store) {
  const s = store || createStore();
  const db = makeDb(s);
  return {
    connect: async () => db,
    getDb: () => db,
    close: async () => {},
    __store: s,
  };
}

module.exports = { createStore, makeDbModule, hexId };

