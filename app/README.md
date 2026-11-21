# TOBIRA (prototype)

**Official rules → Today's task → Submitted.**
TOBIRA takes a first-time student through one real contest to their first submission. The student creates; TOBIRA plans, asks questions and checks against the rules. It never writes the entry.

## Run

```bash
npm install
npm run dev                    # http://localhost:3000 (Vite HMR inside the Node server)

npm run build && npm start     # production build, same port
```

Node 24. No native-compiled dependencies. Fonts (M PLUS 1p) are bundled, so nothing is fetched from a CDN at runtime: the app works fully offline in demo mode. `PORT` and `HOST` env vars are respected.

(npm 12 may warn that it skipped esbuild's install script. That is harmless: Vite still finds the prebuilt binary.)

## AI providers and demo mode

Picked in this order (see `server/ai/index.mjs`):

1. **Demo mode**: forced by `TOBIRA_DEMO=1`, by `?demo=1` in the browser (remembered; `?demo=0` turns it off), or by any `/demo/*` link.
2. **Anthropic API**: when `ANTHROPIC_API_KEY` is set. Uses `claude-opus-5-5` (override with `TOBIRA_MODEL`), structured outputs for rules/plan/review, streaming for the coach, server-side refusal fallback enabled.
3. **`claude` CLI**: opt-in with `TOBIRA_PROVIDER=claude-cli` (shells out to `claude -p`; slower; the coach reply is streamed to the UI after it is generated).
4. Otherwise **demo**.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

The **demo provider** is handwritten fixtures for the sample contest, with simulated latency and streaming. It decodes the rules, builds the plan, runs a scripted Socratic coach (which declines to write the entry), and does a *real* rule check of the draft: it looks for the required sections, the AI-use note, names in the body, the page estimate, the title/summary length and the ticked boxes. It can only decode the sample contest, and says so if you paste something else. Whenever it is active, the UI shows a **Demo mode** badge.

**AI cost** is recorded for every call (input/output/cache tokens → USD at list price) and shown in the student app's meter and in the pilot dashboard. In demo mode the numbers are *estimates* of what the same call would cost live, and they are labelled "est.".

## Deep links (deterministic, for screenshots and stage demos)

| Link | Shows |
|---|---|
| `/demo/start` | Door: paste rules or try the sample |
| `/demo/rules` | Rules, decoded (cards with the exact source sentences) |
| `/demo/plan` | Plan timeline, 28 days, Plan → Build → Review → Submit |
| `/demo/today` | Today's task (day 8) |
| `/demo/stuck` | Coach open with a short exchange |
| `/demo/review` | Final check: 3 to fix |
| `/demo/submitted` | The Submitted moment |
| `/demo/back` | Welcome back after 3 missed days (auto re-plan) |
| `/cohort` | Mentor pilot dashboard (**sample data**, desktop) |

Add `?lang=en` or `?lang=ja` (default: Japanese) and `?still=1` to skip animations to their end state. `/demo/*` sessions run in memory, so they never touch what is saved on the device; you can click through from any of them. Normal sessions (`/`) save to `localStorage` ("Start over" at the bottom of the Plan screen clears it).

## Scripts

```bash
npm run shots   # builds, then writes shots/{en,ja}/<name>.png (390×844 @3x; cohort 1440×900 @2x)
npm run check   # builds, then clicks start → Submitted in both languages (demo mode)
```

Both use Playwright's Firefox: run `npx playwright install firefox` once.

## The sample contest

"第3回 こみちアイデアコンテスト 2026 / The 3rd Komichi Ideas Contest 2026" is **fictional**, as are its organiser and its `.example` address. It is marked SAMPLE everywhere. The deadline is always **today + 28 days** for a fresh start, and every other date in the rules (publication, revision note, results) is derived from it, so the demo never goes stale. Seeded screens move "today" along the same 28-day plan (for example, `/demo/today` is day 8, with the deadline 21 days away).

## Layout

```
server.mjs            Node http server (API + Vite dev middleware / static dist)
server/api.mjs        /api/status, /api/rules/parse, /api/plan, /api/coach (NDJSON stream), /api/review, /api/fetch-url
server/ai/            providers (demo, anthropic, claude-cli), prompts, zod schemas
shared/               sample contest, task library, plan/re-plan math, coach + review fixtures, pricing
src/                  React app (screens/, styles.css, i18n.js)
scripts/              shots.mjs, flow-check.mjs
```
