const { classify, ORDER_ID_RE } = require('./intent-classifier');
const { getOrderStatus, searchProducts, answerFromGroundTruth, callLLM } = require('./function-registry');
const { assistantStats } = require('../routes/dashboard');
const fs = require('fs');
const path = require('path');
const { validateResponseCitations } = require('./citation-validator');
let YAML;

function recordIntent(intent) {
  assistantStats.intents[intent] = (assistantStats.intents[intent] || 0) + 1;
  assistantStats.queries = (assistantStats.queries || 0) + 1;
}
function recordFunction(name) {
  assistantStats.functionCalls[name] = (assistantStats.functionCalls[name] || 0) + 1;
}

function recordTiming(intent, ms) {
  assistantStats.timings = assistantStats.timings || { intentResponseMs: {}, llmMsByIntent: {} };
  const bucket = assistantStats.timings.intentResponseMs[intent] || { count: 0, totalMs: 0 };
  bucket.count += 1; bucket.totalMs += ms; assistantStats.timings.intentResponseMs[intent] = bucket;
}

function recordLlmTiming(intent, ms) {
  assistantStats.timings = assistantStats.timings || { intentResponseMs: {}, llmMsByIntent: {} };
  const bucket = assistantStats.timings.llmMsByIntent[intent] || { count: 0, totalMs: 0 };
  bucket.count += 1; bucket.totalMs += ms; assistantStats.timings.llmMsByIntent[intent] = bucket;
}

const ORDER_POLICY_ID = 'Order1.1';

// Load prompts from docs/prompts.yaml
let PROMPTS_CACHE = null;
function loadPrompts() {
  if (PROMPTS_CACHE) return PROMPTS_CACHE;
  const candidates = [
    path.join(process.cwd(), 'docs', 'prompts.yaml'),
    path.join(process.cwd(), '..', '..', 'docs', 'prompts.yaml'),
    path.join(__dirname, '../../../..', 'docs', 'prompts.yaml'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const src = fs.readFileSync(p, 'utf-8');
        YAML = YAML || require('yaml');
        PROMPTS_CACHE = YAML.parse(src) || {};
        return PROMPTS_CACHE;
      }
    } catch {}
  }
  PROMPTS_CACHE = {};
  return PROMPTS_CACHE;
}

function getIntentConfig(intentId) {
  const cfg = loadPrompts();
  const intents = Array.isArray(cfg?.intents) ? cfg.intents : [];
  return intents.find((i) => i.id === intentId) || {};
}

function buildPrompt(intentId, context) {
  const cfg = loadPrompts();
  const a = cfg?.assistant || {};
  const ic = getIntentConfig(intentId);
  const parts = [];
  if (a.name || a.role) parts.push(`${a.name || 'Assistant'}${a.role ? ' - ' + a.role : ''}`);
  if (a.persona) parts.push(String(a.persona).trim());
  if (Array.isArray(a.rules) && a.rules.length) parts.push('Rules:\n- ' + a.rules.join('\n- '));
  if (ic.behavior) parts.push(`Behavior (${intentId}):\n${ic.behavior}`);
  if (ic.tone) parts.push(`Tone: ${ic.tone}`);
  if (context?.message) parts.push(`User: ${context.message}`);
  if (Array.isArray(context?.items) && context.items.length) {
    const names = context.items.map((i) => `${i.name} ($${i.price})`).slice(0, 5).join(', ');
    parts.push(`Items: ${names}`);
  }
  if (context?.order) parts.push(`Order: status=${context.order.status}, carrier=${context.order.carrier || 'TBD'}, ETA=${context.order.eta || 'TBD'}`);
  if (context?.groundTruth) parts.push(`GroundTruth: ${context.groundTruth}`);
  if (Array.isArray(context?.citations) && context.citations.length) parts.push(`Citations: ${context.citations.map((c) => `[${c}]`).join(' ')}`);
  parts.push('Respond briefly in one or two sentences.');
  return parts.join('\n\n');
}

function parseProductQuery(message) {
  const text = (message || '').toLowerCase();
  let budget = null;
  // Extract budget like: under $100, below 200, less than 50$, under 100 dollars
  const m = text.match(/\b(under|below|less than)\s*\$?(\d{2,5})/i);
  if (m && m[2]) budget = parseFloat(m[2]);

  // Remove common lead-in verbs/phrases
  let q = text
    .replace(/^(please\s+)?(find|search|show|recommend|suggest|i\s*(?:am|\'m)?\s*looking\s*for|looking\s*for|i\s*want|i\s*need|buy)\b[:\-]?\s*/i, '')
    .replace(/\b(under|below|less than)\s*\$?\d{2,5}(\s*(usd|dollars))?/gi, '')
    .replace(/\b(products?|items?)\b/gi, '')
    .replace(/\b(with|for|about|around|at|please|the|a|an)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Fallback if we stripped too much
  if (!q) q = text.trim();
  return { query: q, budget };
}

async function handleMessage({ message, email }) {
  const started = Date.now();
  const intent = classify(message);
  recordIntent(intent);

  const res = { intent, reply: '', citations: [], functionsCalled: [], data: undefined };

  function finalizeResponse() {
    try {
      const report = validateResponseCitations(res.reply);
      res.validation = report;
      res.citations = Array.isArray(report?.citations) ? report.citations : (res.citations || []);
    } catch {}
    // record total time per intent
    try { recordTiming(intent, Date.now() - started); } catch {}
    return res;
  }

  async function callLLMMeasured(prompt) {
    const t0 = Date.now();
    const out = await callLLM({ prompt });
    try { recordLlmTiming(intent, Date.now() - t0); } catch {}
    return out;
  }

  // order_status â†’ function call + concise answer
  if (intent === 'order_status') {
    const match = (message || '').match(ORDER_ID_RE);
    if (!match) {
      res.reply = 'Could you share your order ID (last 10+ chars only)?';
      return finalizeResponse();
    }
    const orderId = match[0];
    const status = await getOrderStatus({ orderId });
    recordFunction('getOrderStatus');
    res.functionsCalled.push('getOrderStatus');
    if (!status.found) {
      res.reply = 'I could not find that order. Please double-check the ID.';
      return finalizeResponse();
    }
    const eta = status.estimatedDelivery ? new Date(status.estimatedDelivery).toDateString() : 'TBD';
    try {
      const prompt = buildPrompt('order_status', { message, order: { status: status.status, carrier: status.carrier, eta }, citations: [ORDER_POLICY_ID] });
      const out = await callLLMMeasured(prompt);
      recordFunction('callLLM');
      res.functionsCalled.push('callLLM');
      const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
      res.reply = txt || `Your order is currently ${status.status}. Carrier: ${status.carrier || 'TBD'}. ETA: ${eta}. [${ORDER_POLICY_ID}]`;
    } catch {
      res.reply = `Your order is currently ${status.status}. Carrier: ${status.carrier || 'TBD'}. ETA: ${eta}. [${ORDER_POLICY_ID}]`;
    }
    res.citations.push(ORDER_POLICY_ID);
    res.data = status;
    return finalizeResponse();
  }

  // complaint â†’ LLM prompt (fallback to static)
  // chitchat -> use persona/tone from prompts.yaml via LLM with safe fallback
  if (intent === 'chitchat') {
    const prompt = buildPrompt('chitchat', { message });
    try {
      const out = await callLLMMeasured(prompt);
      recordFunction('callLLM');
      res.functionsCalled.push('callLLM');
      const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
      res.reply = txt || 'Hi! How can I help with your order, products, or a policy today?';
    } catch {
      res.reply = 'Hi! How can I help with your order, products, or a policy today?';
    }
    return finalizeResponse();
  }

  if (intent === 'complaint') {
    try {
      const prompt = buildPrompt('complaint', { message });
      const out = await callLLMMeasured(prompt);
      recordFunction('callLLM');
      res.functionsCalled.push('callLLM');
      const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
      res.reply = txt || "I'm really sorry about this experience. I can help fix it right away. Could you share your order ID (last 10+ chars) and a brief description of the issue?";
    } catch {
      res.reply = "I'm really sorry about this experience. I can help fix it right away. Could you share your order ID (last 10+ chars) and a brief description of the issue?";
    }
    return finalizeResponse();
  }

  

  // off_topic â†’ LLM prompt (fallback to static)
  if (intent === 'off_topic') {
    try {
      const prompt = buildPrompt('off_topic', { message });
      const out = await callLLMMeasured(prompt);
      recordFunction('callLLM');
      res.functionsCalled.push('callLLM');
      const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
      res.reply = txt || "I'm here to help with Shoplite orders, products, and policies. Could you share how I can assist with those?";
    } catch {
      res.reply = "I'm here to help with Shoplite orders, products, and policies. Could you share how I can assist with those?";
    }
    return finalizeResponse();
  }

  // violation â†’ LLM prompt (fallback to static)
  if (intent === 'violation') {
    try {
      const prompt = buildPrompt('violation', { message });
      const out = await callLLMMeasured(prompt);
      recordFunction('callLLM');
      res.functionsCalled.push('callLLM');
      const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
      res.reply = txt || "I want to keep things respectful so I can help you. Let's focus on your order, products, or a policy question.";
    } catch {
      res.reply = "I want to keep things respectful so I can help you. Let's focus on your order, products, or a policy question.";
    }
    return finalizeResponse();
  }
  // product_search â†’ function call (+ optional LLM summarization on success)
  if (intent === 'product_search') {
    const { query, budget } = parseProductQuery(message);
    let items = await searchProducts({ query });
    recordFunction('searchProducts');
    res.functionsCalled.push('searchProducts');
    // Apply budget filter client-side if provided
    if (budget) items = (items || []).filter((i) => typeof i.price === 'number' && i.price <= budget);
    if (!items || !items.length) {
      res.reply = "I couldn't find matching products. Try another keyword?";
      return finalizeResponse();
    }
    // Try LLM rephrase (same pattern as policy_question); safe fallback
    const names = items.map((i) => `${i.name} ($${i.price})`).slice(0, 5).join(', ');
    const fallback = `Found ${items.length} item(s): ${names}.`;
    try {
      const prompt = `Answer as Shoplite Support (do not reveal AI model). Use polite, concise tone. User asked: ${message}.${budget ? ` Under $${budget}.` : ''} Recommend briefly in one sentence. Items: ${names}`;
      const out = await callLLMMeasured(prompt);
      recordFunction('callLLM');
      res.functionsCalled.push('callLLM');
      const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
      res.reply = txt || fallback;
    } catch {
      res.reply = fallback;
    }
    res.data = items;
    return finalizeResponse();
  }

  // policy_question â†’ ground-truth first, fallback to LLM
  if (intent === 'policy_question') {
    const gt = answerFromGroundTruth({ message, k: 3 });
    recordFunction('answerFromGroundTruth');
    res.functionsCalled.push('answerFromGroundTruth');
    const top = Array.isArray(gt?.top) ? gt.top.slice(0, 3) : [];
    const ground = top.length
      ? top.map((t, i) => `Policy ${i + 1} [${t.id}]: ${t.answer}`).join('\n')
      : 'No direct match in ground-truth.';
    const prompt = buildPrompt('policy_question', {
      message,
      groundTruth: `Use only the following policy snippets to answer. If insufficient, ask a brief clarifying question.\n${ground}`,
    });
    try {
      const out = await callLLMMeasured(prompt);
      recordFunction('callLLM');
      res.functionsCalled.push('callLLM');
      const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
      if (txt) {
        const m = txt.match(/\[([^\]]+)\]/g) || [];
        res.citations.push(...m.map((t) => t.slice(1, -1)));
        res.reply = txt;
      } else if (gt?.answer) {
        const m = gt.answer.match(/\[([^\]]+)\]/g) || [];
        res.citations.push(...m.map((t) => t.slice(1, -1)));
        res.reply = gt.answer;
      } else {
        res.reply = 'Sorry, I could not find that.';
      }
    } catch {
      if (gt?.answer) {
        const m = gt.answer.match(/\[([^\]]+)\]/g) || [];
        res.citations.push(...m.map((t) => t.slice(1, -1)));
        res.reply = gt.answer;
      } else {
        res.reply = 'Sorry, I could not find that.';
      }
    }
    return finalizeResponse();
  }

  // fallback (should rarely happen)
  try {
    const prompt = buildPrompt(intent, { message });
    const out = await callLLMMeasured(prompt);
    recordFunction('callLLM');
    res.functionsCalled.push('callLLM');
    const txt = (out && out.ok && typeof out.output === 'string') ? out.output.trim() : '';
    res.reply = txt || 'How can I help with your order, products, or a policy?';
  } catch {
    res.reply = 'How can I help with your order, products, or a policy?';
  }
  return finalizeResponse();
}

module.exports = { handleMessage };
