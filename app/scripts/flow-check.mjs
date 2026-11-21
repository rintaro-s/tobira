// npm run check — clicks through the whole student flow (start -> Submitted) in demo
// mode, in both languages, plus the cohort page and the welcome-back re-plan.
// Requires a production build (npm run build) and Playwright Firefox.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { firefox } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4318;
const BASE = `http://127.0.0.1:${PORT}`;
const server = spawn(process.execPath, ['server.mjs'], { cwd: root, env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', TOBIRA_DEMO: '1', TOBIRA_DEMO_FAST: '1' }, stdio: 'ignore' });
process.on('exit', () => server.kill());

for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${BASE}/api/status`)).ok) break; } catch { /* wait */ }
  await new Promise((r) => setTimeout(r, 150));
}

const ok = (m) => console.log('  ✓', m);
const browser = await firefox.launch();
let failed = false;
try {
  for (const lang of ['ja', 'en']) {
    console.log(`[${lang}] student flow`);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/?lang=${lang}`);
    await page.click('.sample-btn');
    for (let q = 0; q < 3; q++) {
      if (q !== 1) await page.locator('.pick').first().click();
      else await page.locator('.minute').nth(1).click();
      await page.click('.quiz-actions .btn-ink');
    }
    await page.waitForSelector('.contest-name');
    ok('rules decoded');
    await page.click('.cta-bar .btn');
    await page.waitForSelector('.plan-hero');
    ok(`plan built (${await page.locator('.tl li').count()} days)`);
    await page.click('.cta-bar .btn');
    await page.waitForSelector('.taskcard .task-title');
    ok(`today: ${await page.locator('.task-title').innerText()}`);
    await page.click('.task-actions .btn-outline-ink');
    await page.waitForSelector('.coach');
    await page.locator('.quick button').nth(0).click();
    await page.waitForFunction(() => document.querySelectorAll('.bubble.them').length === 2 && !document.querySelector('.typing'));
    await page.locator('.quick button').nth(1).click();
    await page.waitForFunction(() => document.querySelectorAll('.bubble.them').length === 3 && !document.querySelector('.typing'));
    await page.waitForTimeout(300);
    const reply = await page.locator('.bubble.them').last().innerText();
    if (!/あなたの言葉|your words/.test(reply)) throw new Error('coach did not decline to write the entry: ' + reply);
    ok('coach streamed and kindly declined to write it');
    await page.click('.coach-head .x');
    await page.click('.done-btn');
    await page.waitForSelector('.taskcard-done');
    ok('done for today');
    await page.click('.tabs button:nth-child(4)');
    await page.waitForSelector('.review');
    await page.locator('.field input').fill(lang === 'ja' ? '傘まちがえゼロ・クリップ' : 'Zero Mix-up Umbrella Clips');
    await page.locator('.field textarea').first().fill(lang === 'ja' ? '雨の日の放課後、自分の傘が見つからない問題を、形と色のしるしクリップで解決します。' : 'Students can’t find their umbrella on rainy afternoons. Shape-and-colour clips fix that.');
    await page.click('.draft .linkish'); // demo: load revised draft
    await page.click('.draft .btn-ink');
    await page.waitForSelector('.verdict');
    ok(`first check: ${await page.locator('.verdict strong').innerText()}`);
    for (const box of await page.locator('.check input').all()) await box.check({ force: true });
    await page.click('.draft .btn-ink');
    await page.waitForSelector('.verdict-green');
    ok('all clear');
    await page.click('.submit-box .btn-lime');
    await page.waitForSelector('.sub-big');
    ok(`submitted: ${await page.locator('.sub-big').innerText()}`);
    await page.reload();
    await page.waitForSelector('.sub-big');
    ok('state persisted across reload');
    if (errors.length) throw new Error('page errors: ' + errors.join('; '));
    await ctx.close();
  }

  console.log('[welcome back]');
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/demo/back?lang=en`);
  await page.waitForSelector('.welcome');
  ok(await page.locator('.welcome').innerText());
  await page.goto(`${BASE}/cohort?lang=en`);
  await page.waitForSelector('.co-table tbody tr');
  ok(`cohort rows: ${await page.locator('.co-table tbody tr').count()}`);
  await ctx.close();
} catch (e) {
  failed = true;
  console.error('FAIL:', e.message);
} finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
