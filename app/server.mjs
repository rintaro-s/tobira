// TOBIRA server: one Node process serves the API and the app.
//   npm run dev   -> Vite in middleware mode (HMR)
//   npm start     -> serves the production build in ./dist
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './server/api.mjs';
import { initProviders, status } from './server/ai/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DEV = process.argv.includes('--dev');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};

await initProviders();

let vite = null;
if (DEV) {
  const { createServer } = await import('vite');
  vite = await createServer({ root: here, server: { middlewareMode: true }, appType: 'spa' });
}

const dist = path.join(here, 'dist');
if (!DEV && !fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('No production build found. Run `npm run build` first (or `npm run dev`).');
  process.exit(1);
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  let file = path.normalize(path.join(dist, decodeURIComponent(url.pathname)));
  if (!file.startsWith(dist)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html'); // SPA fallback
  const ext = path.extname(file);
  const headers = { 'content-type': MIME[ext] || 'application/octet-stream' };
  if (url.pathname.startsWith('/assets/')) headers['cache-control'] = 'public, max-age=31536000, immutable';
  else headers['cache-control'] = 'no-cache';
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/api/')) return await handleApi(req, res);
    if (vite) return vite.middlewares(req, res, () => res.writeHead(404).end());
    return serveStatic(req, res);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'server' }));
  }
});

server.listen(PORT, HOST, () => {
  const s = status();
  console.log(`\n  TOBIRA ${DEV ? '(dev)' : '(production)'}  http://localhost:${PORT}`);
  console.log(`  AI provider: ${s.provider}${s.provider === 'demo' ? ` (demo mode: ${s.reason})` : ` · ${s.model}`}`);
  console.log(`  Pilot dashboard: http://localhost:${PORT}/cohort   Stage demo: http://localhost:${PORT}/demo/start\n`);
});
