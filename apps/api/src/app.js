const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const customersRouter = require('./routes/customers');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const analyticsRouter = require('./routes/analytics');
const dashboardRouter = require('./routes/dashboard');
const { perf } = require('./routes/dashboard');
const sseOrderStatus = require('./sse/order-status');
const assistantEngine = require('./assistant/engine');

const app = express();

// CORS for API + handle preflight
const corsEnv = process.env.CORS_ORIGIN || '*';
const allowedOrigins = corsEnv.split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = allowedOrigins.includes('*')
  ? { origin: '*' }
  : {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow Vercel preview URLs if base domain is present
        const ok = allowedOrigins.some(base => base && origin.endsWith(base.replace(/^https?:\/\//, '')));
        return ok ? callback(null, true) : callback(null, false);
      },
    };
app.use(cors(corsOptions));
app.options('*', cors());
app.use(express.json());
// Global performance tracking (dev-only)
app.use((req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - t0;
    perf.requestCount += 1;
    perf.latencyMsTotal += ms;
    perf.latencySamples += 1;
    if (res.statusCode >= 400) perf.failedRequests += 1;
  });
  next();
});
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/dashboard', dashboardRouter.router);

app.get('/api/orders/:id/stream', sseOrderStatus);

app.post('/api/assistant/message', async (req, res) => {
  try {
    const { message, email } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'message is required' } });
    }
    const result = await assistantEngine.handleMessage({ message, email });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Unexpected error' } });
  }
});

module.exports = app;
