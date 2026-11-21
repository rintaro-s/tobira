// Demo provider: handwritten fixtures for the SAMPLE contest, simulated latency and
// streaming, zero network. This is what runs on stage. Token usage is *estimated*
// (what the same call would roughly cost live) and always flagged as estimated.

import { sampleDecoded, sampleRulesText, isSampleText } from '../../shared/sample.js';
import { buildSamplePlan } from '../../shared/plan.js';
import { coachReply } from '../../shared/sample-coach.js';
import { demoReview } from '../../shared/sample-review.js';
import { estimateTokens, costUsd, DEFAULT_MODEL } from '../../shared/pricing.js';
import { parseRulesPrompt, planPrompt, reviewPrompt, coachPrompt } from './prompts.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FAST = process.env.TOBIRA_DEMO_FAST === '1';
const wait = (ms) => (FAST ? Promise.resolve() : sleep(ms));

export class DemoUnsupportedError extends Error {
  constructor() {
    super('demo-unsupported');
    this.code = 'demo-unsupported';
  }
}

function usage(inputParts, output, thinkingFactor = 1.4) {
  const input_tokens = inputParts.reduce((n, p) => n + estimateTokens(p), 0);
  const output_tokens = Math.ceil(estimateTokens(output) * thinkingFactor);
  const u = { input_tokens, output_tokens };
  return { provider: 'demo', model: DEFAULT_MODEL, ...u, costUsd: costUsd(DEFAULT_MODEL, u), estimated: true };
}

function requireSample({ sample, rulesText }) {
  if (!sample && !isSampleText(rulesText)) throw new DemoUnsupportedError();
}

export const demoProvider = {
  name: 'demo',

  async parseRules({ rulesText, lang, deadline, sample, today }) {
    requireSample({ sample, rulesText });
    await wait(1400);
    const rules = sampleDecoded(lang, deadline);
    return { rules, usage: usage([parseRulesPrompt({ lang, today }).system, rulesText], rules, 1.6) };
  },

  async buildPlan({ rules, profile, lang, today, sample }) {
    if (!sample) throw new DemoUnsupportedError();
    await wait(900);
    const plan = buildSamplePlan({ startDate: today, deadline: rules.deadline.date, profile });
    const out = plan.tasks.map((t) => ({ title: t.title[lang], why: t.why[lang], steps: t.steps[lang] }));
    return { plan, usage: usage([planPrompt({ lang, counts: {}, minutes: profile?.minutes, profile: { skills: [], interests: [] }, startDate: today, deadline: rules.deadline.date }), rules], out) };
  },

  async coach({ lang, task, messages, deadline, today, sample, rulesText }, onText) {
    if (!sample) throw new DemoUnsupportedError();
    const reply = coachReply({ lang, task, messages, deadline, today });
    await wait(450); // "thinking"
    // Simulated streaming: small chunks at a natural reading pace.
    const chars = [...reply];
    const step = lang === 'ja' ? 2 : 5;
    for (let i = 0; i < chars.length; i += step) {
      onText(chars.slice(i, i + step).join(''));
      await wait(lang === 'ja' ? 28 : 22);
    }
    const rt = rulesText || sampleRulesText(lang, deadline);
    return usage([coachPrompt({ lang }), rt, JSON.stringify(messages)], reply, 1.2);
  },

  async review({ lang, draft, title, summary, checked, deadline, sample }) {
    if (!sample) throw new DemoUnsupportedError();
    await wait(1300);
    const ja = sampleDecoded('ja', deadline);
    const en = sampleDecoded('en', deadline);
    const checklist = ja.checklist.map((c, i) => ({
      id: c.id,
      label: lang === 'ja' ? c.label : en.checklist[i].label,
      labelBoth: { ja: c.label, en: en.checklist[i].label },
      quoteBoth: { ja: c.quote, en: en.checklist[i].quote },
    }));
    const review = demoReview({ deadline, draft, title, summary, checked, checklist });
    return { review, usage: usage([reviewPrompt({ lang }), sampleRulesText(lang, deadline), draft, title, summary], review.items.map((i) => [i.title[lang], i.detail[lang]]), 1.5) };
  },
};
