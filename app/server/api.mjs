import Anthropic from '@anthropic-ai/sdk';
import { pickProvider, status } from './ai/index.mjs';

const MAX_BODY = 1_000_000;

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('too large'), { code: 'too-large' })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
};

function errorBody(e) {
  if (e?.code === 'demo-unsupported') return [422, { error: 'demo-unsupported' }];
  if (e?.code === 'refusal') return [422, { error: 'refusal' }];
  if (e?.code === 'too-large') return [413, { error: 'too-large' }];
  if (e instanceof Anthropic.AuthenticationError) return [502, { error: 'api-auth', message: 'ANTHROPIC_API_KEY was rejected.' }];
  if (e instanceof Anthropic.RateLimitError) return [502, { error: 'api-rate', message: 'Rate limited. Try again shortly.' }];
  if (e instanceof Anthropic.APIConnectionError) return [502, { error: 'api-offline', message: 'Could not reach the AI service.' }];
  if (e instanceof Anthropic.APIError) return [502, { error: 'api', message: e.message }];
  console.error(e);
  return [500, { error: 'server', message: String(e?.message || e) }];
}

function htmlToText(html) {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|dd|dt)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '・')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n')
    .slice(0, 60000);
}

export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://x');
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/status') return send(res, 200, status());

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(res, ...errorBody(e.code ? e : { code: 'bad-json' }));
  }
  const provider = pickProvider(body.demo === true);

  try {
    switch (route) {
      case 'POST /api/rules/parse': {
        if (!body.rulesText?.trim()) return send(res, 400, { error: 'empty' });
        const out = await provider.parseRules(body);
        return send(res, 200, { ...out, provider: provider.name });
      }
      case 'POST /api/plan': {
        const out = await provider.buildPlan(body);
        return send(res, 200, { ...out, provider: provider.name });
      }
      case 'POST /api/review': {
        const out = await provider.review(body);
        return send(res, 200, { ...out, provider: provider.name });
      }
      case 'POST /api/coach': {
        res.writeHead(200, { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store', 'x-accel-buffering': 'no' });
        const line = (o) => res.write(`${JSON.stringify(o)}\n`);
        line({ t: 'start', provider: provider.name });
        try {
          const usage = await provider.coach(body, (v) => line({ t: 'text', v }));
          line({ t: 'usage', v: usage });
          line({ t: 'done' });
        } catch (e) {
          const [, b] = errorBody(e);
          line({ t: 'error', v: b });
        }
        return res.end();
      }
      case 'POST /api/fetch-url': {
        let target;
        try { target = new URL(body.url); } catch { return send(res, 400, { error: 'bad-url' }); }
        if (!/^https?:$/.test(target.protocol)) return send(res, 400, { error: 'bad-url' });
        let r;
        try {
          r = await fetch(target, { signal: AbortSignal.timeout(10000), headers: { 'user-agent': 'TOBIRA-prototype' } });
        } catch {
          return send(res, 502, { error: 'fetch-failed' });
        }
        if (!r.ok) return send(res, 502, { error: 'fetch-failed', status: r.status });
        const type = r.headers.get('content-type') || '';
        if (!/text|html/.test(type)) return send(res, 415, { error: 'not-text' });
        const raw = await r.text();
        return send(res, 200, { text: type.includes('html') ? htmlToText(raw) : raw.slice(0, 60000) });
      }
      default:
        return send(res, 404, { error: 'not-found' });
    }
  } catch (e) {
    return send(res, ...errorBody(e));
  }
}
