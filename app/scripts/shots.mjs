// npm run shots — renders every deep link in both languages to app/shots/{en,ja}/<name>.png
// Student screens: 390x844 CSS px @3x. Cohort: 1440x900 @2x.
// Uses Playwright's Firefox (npx playwright install firefox). Falls back to Chromium if present.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const PORT = Number(process.env.SHOTS_PORT || 4317);
const BASE = `http://127.0.0.1:${PORT}`;
const STUDENT = ['start', 'rules', 'plan', 'today', 'stuck', 'review', 'submitted'];

const { firefox, chromium } = await import('playwright');

const server = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', TOBIRA_DEMO: '1' },
  stdio: ['ignore', 'pipe', 'inherit'],
});
const stop = () => server.kill('SIGTERM');
process.on('exit', stop);

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${BASE}/api/status`);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error('server did not start');
}

async function launch() {
  try {
    return await firefox.launch();
  } catch (e) {
    console.warn('Firefox launch failed, trying Chromium:', e.message.split('\n')[0]);
    return chromium.launch();
  }
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
}

try {
  await waitForServer();
  const browser = await launch();
  const out = [];
  for (const lang of ['en', 'ja']) {
    const dir = path.join(root, 'shots', lang);
    fs.mkdirSync(dir, { recursive: true });

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: lang === 'ja' ? 'ja-JP' : 'en-US' });
    const page = await mobile.newPage();
    for (const name of STUDENT) {
      await page.goto(`${BASE}/demo/${name}?lang=${lang}&still=1`);
      await settle(page);
      const file = path.join(dir, `${name}.png`);
      await page.screenshot({ path: file });
      out.push(file);
      console.log('  ✓', path.relative(root, file));
    }
    await mobile.close();

    const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: lang === 'ja' ? 'ja-JP' : 'en-US' });
    const dpage = await desk.newPage();
    await dpage.goto(`${BASE}/cohort?lang=${lang}&still=1`);
    await settle(dpage);
    const file = path.join(dir, 'cohort.png');
    await dpage.screenshot({ path: file });
    out.push(file);
    console.log('  ✓', path.relative(root, file));
    await desk.close();
  }
  await browser.close();
  console.log(`\n${out.length} screenshots written to ${path.join(root, 'shots')}`);
} finally {
  stop();
}
