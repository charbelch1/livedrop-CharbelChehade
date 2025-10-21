const fs = require('fs');
const path = require('path');

let KB_ID_SET = null;

function loadKnowledgeBaseIds() {
  if (KB_ID_SET) return KB_ID_SET;
  const candidates = [
    path.join(process.cwd(), 'docs', 'ground-truth.json'),
    path.join(process.cwd(), '..', '..', 'docs', 'ground-truth.json'),
    path.join(__dirname, '../../../..', 'docs', 'ground-truth.json'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw);
        const ids = Array.isArray(data)
          ? data.map((x) => String(x?.id || '').trim()).filter(Boolean)
          : [];
        KB_ID_SET = new Set(ids);
        return KB_ID_SET;
      }
    } catch (e) {
      // ignore and try next candidate
    }
  }
  KB_ID_SET = new Set();
  return KB_ID_SET;
}

function extractCitations(text) {
  const src = typeof text === 'string' ? text : '';
  const matches = src.match(/\[([^\]]+)\]/g) || [];
  const all = matches.map((m) => m.slice(1, -1).trim()).filter(Boolean);
  const seen = new Set();
  const unique = [];
  for (const id of all) {
    if (!seen.has(id)) { seen.add(id); unique.push(id); }
  }
  return unique;
}

function validateCitations(citations) {
  const ids = Array.isArray(citations) ? citations : [];
  const kb = loadKnowledgeBaseIds();
  const validCitations = [];
  const invalidCitations = [];
  for (const id of ids) {
    if (kb.has(id)) validCitations.push(id); else invalidCitations.push(id);
  }
  return {
    isValid: invalidCitations.length === 0,
    validCitations,
    invalidCitations,
  };
}

function validateResponseCitations(responseText) {
  const citations = extractCitations(responseText);
  const base = validateCitations(citations);
  return { citations, ...base };
}

module.exports = {
  loadKnowledgeBaseIds,
  extractCitations,
  validateCitations,
  validateResponseCitations,
};

