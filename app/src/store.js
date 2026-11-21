// App state: one small external store. Normal sessions persist to localStorage;
// /demo/* deep links run on a seeded in-memory copy so screenshots are deterministic
// and a stage demo never touches (or is affected by) anything saved on the device.

import { useSyncExternalStore } from 'react';
import { addDays, todayISO } from '../shared/dates.js';
import { SAMPLE_DAYS, sampleDecoded, sampleRulesText } from '../shared/sample.js';
import { buildSamplePlan } from '../shared/plan.js';
import { seededStuckExchange } from '../shared/sample-coach.js';
import { demoReview, sampleDraft, SAMPLE_TITLE, SAMPLE_SUMMARY } from '../shared/sample-review.js';
import { STR } from './i18n.js';

const KEY = 'tobira.v1';
const listeners = new Set();
let state;
let session = { demo: false, still: false, screen: null, today: todayISO() };
let server = { provider: 'demo', model: null, reason: 'loading' };

export const blank = () => ({
  lang: 'ja',
  demoMode: false,
  name: '',
  profile: { skills: [], skillsOther: '', minutes: 30, interests: [], interestsOther: '' },
  contest: null,
  plan: null,
  coach: { open: false, messages: [] },
  review: { draft: '', title: '', summary: '', checked: {}, result: null, runs: 0 },
  submittedAt: null,
  usage: [],
  lastActive: null,
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...blank(), ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}
function save() {
  if (session.demo) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep going in memory */
  }
}
const emit = () => listeners.forEach((l) => l());

export function getState() {
  return state;
}
export function setState(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  save();
  emit();
}
export function resetAll() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  state = { ...blank(), lang: state.lang };
  emit();
}
export function useStore() {
  return useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => state);
}
export const getSession = () => session;
export const getServer = () => server;
export const t = () => STR[state.lang];
export function isDemo() {
  return session.demo || state.demoMode || server.provider === 'demo';
}

// ── seeds for /demo/* ──────────────────────────────────────────────
const est = (kind, costUsd, at) => ({ kind, provider: 'demo', model: 'claude-opus-5-5', costUsd, estimated: true, at });

function sampleContest(deadline) {
  return { sample: true, deadline, decodedBy: 'demo', decodedAt: null };
}

function seedProfile() {
  return { skills: ['make', 'design'], skillsOther: '', minutes: 30, interests: ['school'], interestsOther: '' };
}

function seedPlan(startDate, deadline, doneCount, today) {
  const plan = buildSamplePlan({ startDate, deadline, profile: seedProfile() });
  plan.tasks = plan.tasks.map((task, i) => (i < doneCount ? { ...task, status: 'done', doneAt: i === doneCount - 1 && task.date >= today ? today : task.date } : task));
  return plan;
}

export function seed(screen, today, lang) {
  const s = blank();
  s.lang = lang;
  s.name = lang === 'ja' ? '森田 あおい' : 'Aoi Morita';
  if (screen === 'start') return s;
  s.profile = seedProfile();

  if (screen === 'rules' || screen === 'plan') {
    const deadline = addDays(today, SAMPLE_DAYS);
    s.contest = sampleContest(deadline);
    s.usage = [est('rules', 0.071, today)];
    if (screen === 'plan') {
      s.plan = buildSamplePlan({ startDate: today, deadline, profile: s.profile });
      s.usage.push(est('plan', 0.058, today));
    }
    return s;
  }

  if (screen === 'today' || screen === 'stuck' || screen === 'back') {
    // a week in: plan + first build steps done. "back" = away for three days.
    const start = addDays(today, -7);
    const deadline = addDays(start, SAMPLE_DAYS);
    s.contest = sampleContest(deadline);
    const done = screen === 'back' ? 4 : 7;
    s.plan = seedPlan(start, deadline, done, today);
    s.lastActive = screen === 'back' ? addDays(today, -3) : addDays(today, -1);
    s.usage = [est('rules', 0.071, start), est('plan', 0.058, start), est('coach', 0.017, addDays(start, 2)), est('coach', 0.019, addDays(start, 2))];
    if (screen === 'stuck') {
      const task = s.plan.tasks.find((x) => x.status !== 'done');
      s.coach = { open: true, taskId: task.id, messages: seededStuckExchange({ lang, task, deadline, today }) };
      s.usage.push(est('coach', 0.018, today), est('coach', 0.021, today));
    }
    return s;
  }

  if (screen === 'review' || screen === 'submitted') {
    const isSub = screen === 'submitted';
    const start = addDays(today, isSub ? -26 : -24);
    const deadline = addDays(start, SAMPLE_DAYS);
    s.contest = sampleContest(deadline);
    s.plan = seedPlan(start, deadline, isSub ? 27 : 24, today);
    s.lastActive = addDays(today, -1);
    s.usage = [est('rules', 0.071, start), est('plan', 0.058, start), ...Array.from({ length: 9 }, (_, i) => est('coach', 0.018, addDays(start, 2 + i * 2))), est('review', 0.064, addDays(today, -1))];
    const ja = sampleDecoded('ja', deadline);
    const en = sampleDecoded('en', deadline);
    const checklist = ja.checklist.map((c, i) => ({ id: c.id, label: c.label, labelBoth: { ja: c.label, en: en.checklist[i].label }, quoteBoth: { ja: c.quote, en: en.checklist[i].quote } }));
    const checked = Object.fromEntries(checklist.map((c) => [c.id, isSub || c.id !== 'unlisted']));
    const draft = sampleDraft(lang, isSub ? 2 : 1);
    const title = SAMPLE_TITLE[lang];
    const summary = SAMPLE_SUMMARY[lang];
    s.review = { draft, title, summary, checked, result: demoReview({ deadline, draft, title, summary, checked, checklist }), runs: isSub ? 3 : 1 };
    if (isSub) {
      s.submittedAt = today;
      s.usage.push(est('review', 0.066, today), est('review', 0.063, today));
    }
    return s;
  }
  return s;
}

// ── boot ──────────────────────────────────────────────────────────
export function boot() {
  const url = new URL(window.location.href);
  const qLang = url.searchParams.get('lang');
  const m = url.pathname.match(/^\/demo\/(\w+)/);
  session.still = url.searchParams.get('still') === '1';
  session.today = todayISO();
  if (m) {
    session.demo = true;
    session.screen = m[1];
    const saved = load();
    const lang = qLang === 'en' || qLang === 'ja' ? qLang : saved?.lang || 'ja';
    state = seed(m[1], session.today, lang);
  } else {
    state = load() || blank();
    if (qLang === 'en' || qLang === 'ja') state.lang = qLang;
    const qDemo = url.searchParams.get('demo');
    if (qDemo === '1') state.demoMode = true;
    if (qDemo === '0') state.demoMode = false;
    save();
  }
  document.documentElement.lang = state.lang;
  fetch('/api/status')
    .then((r) => r.json())
    .then((s) => { server = s; emit(); })
    .catch(() => { server = { provider: 'demo', reason: 'offline' }; emit(); });
}

/** Rules text + decoded cards for the current contest, in the current language when possible. */
export function contestView(s = state) {
  const c = s.contest;
  if (!c) return null;
  if (c.sample && c.decodedBy === 'demo') {
    return { rulesText: sampleRulesText(s.lang, c.deadline), decoded: sampleDecoded(s.lang, c.deadline), sample: true };
  }
  return { rulesText: c.rulesText, decoded: c.decoded, sample: !!c.sample };
}

export function totalCost(s = state) {
  return s.usage.reduce((n, u) => n + (u.costUsd || 0), 0);
}
