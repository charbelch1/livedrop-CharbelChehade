// Match either a 24-char lowercase hex ID (Mongo ObjectId style) or a 10+ char UPPERCASE alphanumeric code
// Avoid matching common lowercase words of length >=10 (e.g., "internationally")
const ORDER_ID_RE = /\b([a-f0-9]{24}|[A-Z0-9]{10,})\b/;

// Broader keyword/regex coverage per intent with simple scoring
const PATTERNS = {
  violation: [
    /(\bfuck\b|\bshit\b|\bbitch\b|\basshole\b|\bidiot\b|\bdumb\b|\bstupid\b)/i,
    /(\bkill yourself\b|\bgo die\b|\bsuicide\b)/i,
    /(\bracist\b|\bsexist\b|\bhate you\b|\bhate (this|u|you)\b)/i,
    /(\bfuck off\b|\bshut up\b)/i,
  ],
  order_status: [
    /(\border|package|shipment|parcel)\b.*\b(status|track|tracking|update|where|when|eta|arriv(e|al)|deliver(ed|y)|location)\b/i,
    /(status|track|tracking|where|when|eta|arriv(e|al)|deliver(ed|y)|carrier|courier)\b.*\b(order|package|shipment|parcel|tracking|number|id)\b/i,
    /\btracking\s*(#|number|no\.?)[ :\-]?[A-Z0-9\-]{6,}/i,
    /\b(order|purchase)\s*(id|number|no\.?)[ :\-]?[A-Z0-9\-]{6,}/i,
    /\b(when|what)\b.*\b(arrive|delivery|delivered|shipped)\b/i,
  ],
  product_search: [
    /(find|search|show|browse|looking for|recommend|suggest|need|want|buy|purchase|options|best|top)/i,
    /(products?|items?|catalog|inventory|laptop|notebook|phone|smart ?phone|headphon(es)?|earbuds?|watch|tv|camera|tablet|shoes?|clothes?|bag|gift|accessories|charger|case)/i,
    /\bunder\s*\$?\d{2,5}\b/i,
    /\bbudget\b.*\$?\d{2,5}/i,
    /\bcompare\b.*\b(vs|versus)\b/i,
    /\b(deals?|discounts?)\b/i,
  ],
  complaint: [
    /(not\s*working|doesn'?t\s*work|stopped\s*working|broken|defective|faulty|malfunction(ing)?)/i,
    /(damaged|scratched|cracked|leaking|torn)/i,
    /(late|delay(ed)?|never\s*(arrived|received)|didn'?t\s*(arrive|receive)|missing\s*(item|package|parts?))/i,
    /(wrong\s*(item|size|color|product))/i,
    /(issue|problem|complaint|bad service|terrible|awful|horrible|frustrated|angry|upset)/i,
    /(refund\s*(now)?|chargeback|cancel\s*(my\s*)?order|return\s*(this|it))/i,
  ],
  policy_question: [
    /(return|refund|exchange|warranty|guarantee)\b/i,
    /(privacy|data|gdpr|ccpa|security|encryption)\b/i,
    /(shipping|delivery)\s*(policy|time|times|speed|options|methods|international|cost|fee|rates?)\b/i,
    /(payment|pay)\s*(method|option|plan|installments?|bnpl|afterpay|klarna|paypal|apple\s*pay|google\s*pay|credit\s*card|debit)/i,
    /(fees?|charges?|commission|tax|vat|customs|duty|import)/i,
    /(cancellation|cancel)\s*(policy|window|period|fee)/i,
    /\b(terms|conditions|tos|policy)\b/i,
  ],
  chitchat: [
    /(^|\b)(hi|hello|hey|yo|sup|howdy|hola|bonjour|namaste|good\s*(morning|afternoon|evening))(\b|!|\?|\.)/i,
    /(how\s*(are|r)\s*(you|u)|how'?s\s*it\s*going|what'?s\s*up|whats\s*up)/i,
    /(thanks|thank\s*you|ty|appreciate\s*it)/i,
    /(who\s*are\s*you|what'?s\s*your\s*name|your\s*name|your\s*role|what\s*do\s*you\s*do|introduce\s*yourself|tell\s*me\s*about\s*yourself)/i,
    /(who\s*(created|made|built)\s*you|who\s*is\s*your\s*(creator|maker)|who\s*do\s*you\s*work\s*for)/i,
    /(are\s*you\s*(a\s*)?(robot|ai|human)|are\s*you\s*human)/i,
    /(describe\s*(your\s*)?(style|tone|personality)|what\s*is\s*your\s*(style|tone|personality)|your\s*style|your\s*tone|your\s*personality)/i,
    /(what\s*can\s*you\s*do|help\s*(me|us)\s*with)/i,
  ],
};

function score(text, patterns) {
  let s = 0;
  for (const rx of patterns) {
    if (rx.test(text)) s += 1;
  }
  return s;
}

function classify(message) {
  const text = (message || '').toLowerCase();

  // Hard precedence: explicit abuse => violation
  if (score(text, PATTERNS.violation) > 0) return 'violation';

  // Order ID strongly implies order status
  const hasOrderId = ORDER_ID_RE.test(message || '');

  const scores = {
    order_status: score(text, PATTERNS.order_status) + (hasOrderId ? 3 : 0),
    product_search: score(text, PATTERNS.product_search),
    complaint: score(text, PATTERNS.complaint),
    policy_question: score(text, PATTERNS.policy_question),
    chitchat: score(text, PATTERNS.chitchat),
  };

  // Prefer order_status when tracking intent is explicit
  // Tie-breaking priority: order_status > policy_question > complaint > product_search > chitchat
  const order = ['order_status', 'policy_question', 'complaint', 'product_search', 'chitchat'];
  let best = 'off_topic';
  let bestScore = 0;
  for (const k of order) {
    const s = scores[k];
    if (s > bestScore) { best = k; bestScore = s; }
  }

  return bestScore > 0 ? best : 'off_topic';
}

module.exports = { classify, ORDER_ID_RE };
