// Live provider: Anthropic SDK. Structured outputs for rules / plan / review,
// streaming for the coach, token usage recorded on every call.

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { RulesSchema, PlanSchema, ReviewSchema } from './schemas.mjs';
import { parseRulesPrompt, planPrompt, reviewPrompt, coachPrompt, rulesContext, taskContext } from './prompts.mjs';
import { costUsd, DEFAULT_MODEL } from '../../shared/pricing.js';
import { fitTasksToCalendar, phaseCounts } from '../../shared/plan.js';
import { diffDays } from '../../shared/dates.js';
import { describeProfile } from '../../shared/options.js';

const MODEL = process.env.TOBIRA_MODEL || DEFAULT_MODEL;

// Server-side refusal fallback: if the model declines for policy reasons, the API
// retries on the model's default fallback inside the same call.
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };

let client;
const getClient = () => (client ??= new Anthropic());

export class RefusalError extends Error {
  constructor() {
    super('refusal');
    this.code = 'refusal';
  }
}

function usageOf(msg) {
  const u = msg.usage || {};
  const rec = {
    input_tokens: u.input_tokens || 0,
    output_tokens: u.output_tokens || 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens || 0,
    cache_read_input_tokens: u.cache_read_input_tokens || 0,
  };
  const model = msg.model || MODEL;
  return { provider: 'anthropic', model, ...rec, costUsd: costUsd(model, rec), estimated: false };
}

async function structured({ system, user, schema, effort = 'medium' }) {
  const msg = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: 'user', content: user }],
  });
  if (msg.stop_reason === 'refusal') throw new RefusalError();
  if (!msg.parsed_output) throw new Error(`No structured output (stop_reason: ${msg.stop_reason})`);
  return { data: msg.parsed_output, usage: usageOf(msg) };
}

export const anthropicProvider = {
  name: 'anthropic',
  model: MODEL,

  async parseRules({ rulesText, lang, today }) {
    const p = parseRulesPrompt({ lang, today });
    const { data, usage } = await structured({ system: p.system, user: p.user(rulesText), schema: RulesSchema });
    return { rules: data, usage };
  },

  async buildPlan({ rules, profile, lang, today }) {
    const deadline = rules.deadline.date;
    const n = Math.max(1, diffDays(today, deadline));
    const counts = phaseCounts(n);
    const minutes = profile?.minutes || 30;
    const system = planPrompt({ lang, counts, minutes, profile: describeProfile(profile || {}, lang), startDate: today, deadline });
    const { data, usage } = await structured({ system, user: `Decoded rules:\n${JSON.stringify(rules)}`, schema: PlanSchema });
    const plan = fitTasksToCalendar(data.tasks, { startDate: today, deadline, minutesPerDay: minutes });
    return { plan, usage };
  },

  async coach({ lang, task, messages, deadline, today, rules, rulesText }, onText) {
    const history = [{ role: 'user', content: taskContext({ task, today, deadline, lang }) }];
    for (const m of messages) history.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
    const stream = getClient().beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      ...FALLBACK,
      output_config: { effort: 'low' },
      system: [
        { type: 'text', text: coachPrompt({ lang }) },
        { type: 'text', text: rulesContext({ rulesText, rules }), cache_control: { type: 'ephemeral' } },
      ],
      messages: history,
    });
    stream.on('text', (t) => onText(t));
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') throw new RefusalError();
    return usageOf(final);
  },

  async review({ lang, rules, rulesText, draft, title, summary, checked }) {
    const ticks = (rules.checklist || []).map((c) => `[${checked?.[c.id] ? 'x' : ' '}] ${c.label}`).join('\n');
    const user = `${rulesContext({ rulesText, rules })}\n\nEntry title: ${title || '(empty)'}\nSummary: ${summary || '(empty)'}\n\nSelf-check boxes:\n${ticks}\n\nDraft:\n<draft>\n${draft}\n</draft>`;
    const { data, usage } = await structured({ system: reviewPrompt({ lang }), user, schema: ReviewSchema });
    return { review: { items: data.items, checkedAt: new Date().toISOString() }, usage };
  },
};
