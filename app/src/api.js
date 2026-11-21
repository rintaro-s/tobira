import { isDemo, setState, getSession } from './store.js';

function record(usage, kind) {
  if (!usage) return;
  setState((s) => ({ usage: [...s.usage, { kind, ...usage, at: getSession().today }] }));
}

export class ApiError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

async function post(path, body) {
  let r;
  try {
    r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, demo: isDemo() }) });
  } catch {
    throw new ApiError('api-offline');
  }
  const j = await r.json().catch(() => ({ error: 'server' }));
  if (!r.ok) throw new ApiError(j.error || 'server', j.message);
  return j;
}

export async function parseRules(body) {
  const j = await post('/api/rules/parse', body);
  record(j.usage, 'rules');
  return j;
}
export async function buildPlan(body) {
  const j = await post('/api/plan', body);
  record(j.usage, 'plan');
  return j;
}
export async function review(body) {
  const j = await post('/api/review', body);
  record(j.usage, 'review');
  return j;
}
export async function fetchUrl(url) {
  return post('/api/fetch-url', { url });
}

/** Streams the coach reply. onText gets each chunk. Resolves when done. */
export async function coach(body, onText) {
  let r;
  try {
    r = await fetch('/api/coach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...body, demo: isDemo() }) });
  } catch {
    throw new ApiError('api-offline');
  }
  if (!r.ok || !r.body) throw new ApiError('server');
  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (!line.trim()) continue;
      const ev = JSON.parse(line);
      if (ev.t === 'text') onText(ev.v);
      else if (ev.t === 'usage') record(ev.v, 'coach');
      else if (ev.t === 'error') throw new ApiError(ev.v?.error || 'server', ev.v?.message);
    }
  }
}
