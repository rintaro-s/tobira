// Optional provider: shells out to the `claude` CLI (`claude -p`). Opt-in only
// (TOBIRA_PROVIDER=claude-cli) because it is slower and depends on a local login.
// The coach reply is generated in one go and then streamed to the UI in chunks.

import { spawn } from 'node:child_process';
import { z } from 'zod';
import { RulesSchema, PlanSchema, ReviewSchema } from './schemas.mjs';
import { parseRulesPrompt, planPrompt, reviewPrompt, coachPrompt, rulesContext, taskContext } from './prompts.mjs';
import { fitTasksToCalendar, phaseCounts } from '../../shared/plan.js';
import { diffDays } from '../../shared/dates.js';
import { describeProfile } from '../../shared/options.js';

const MODEL = process.env.TOBIRA_CLI_MODEL || '';

function runClaude({ system, prompt, schema }) {
  const args = ['-p', '--output-format', 'json', '--tools', '', '--no-session-persistence', '--system-prompt', system];
  if (schema) args.push('--json-schema', JSON.stringify(z.toJSONSchema(schema)));
  if (MODEL) args.push('--model', MODEL);
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), 180000);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${err.slice(0, 300)}`));
      try {
        resolve(JSON.parse(out));
      } catch {
        reject(new Error('claude returned non-JSON output'));
      }
    });
    child.stdin.end(prompt);
  });
}

function usageOf(res) {
  const u = res.usage || {};
  return {
    provider: 'claude-cli',
    model: Object.keys(res.modelUsage || {})[0] || 'claude (CLI default)',
    input_tokens: u.input_tokens || 0,
    output_tokens: u.output_tokens || 0,
    cache_creation_input_tokens: u.cache_creation_input_tokens || 0,
    cache_read_input_tokens: u.cache_read_input_tokens || 0,
    costUsd: res.total_cost_usd || 0,
    estimated: false,
  };
}

async function structured({ system, prompt, schema }) {
  const res = await runClaude({ system, prompt, schema });
  let data = res.structured_output;
  if (!data) {
    const text = String(res.result || '').replace(/^```(?:json)?\s*|\s*```$/g, '');
    data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  }
  return { data: schema.parse(data), usage: usageOf(res) };
}

export const claudeCliProvider = {
  name: 'claude-cli',
  model: MODEL || 'claude CLI default',

  async parseRules({ rulesText, lang, today }) {
    const p = parseRulesPrompt({ lang, today });
    const { data, usage } = await structured({ system: p.system, prompt: p.user(rulesText), schema: RulesSchema });
    return { rules: data, usage };
  },

  async buildPlan({ rules, profile, lang, today }) {
    const deadline = rules.deadline.date;
    const counts = phaseCounts(Math.max(1, diffDays(today, deadline)));
    const minutes = profile?.minutes || 30;
    const system = planPrompt({ lang, counts, minutes, profile: describeProfile(profile || {}, lang), startDate: today, deadline });
    const { data, usage } = await structured({ system, prompt: `Decoded rules:\n${JSON.stringify(rules)}`, schema: PlanSchema });
    return { plan: fitTasksToCalendar(data.tasks, { startDate: today, deadline, minutesPerDay: minutes }), usage };
  },

  async coach({ lang, task, messages, deadline, today, rules, rulesText }, onText) {
    const transcript = messages.map((m) => `${m.role === 'user' ? 'Student' : 'Coach'}: ${m.text}`).join('\n\n');
    const prompt = `${taskContext({ task, today, deadline, lang })}\n\nConversation so far:\n${transcript}\n\nWrite the coach's next reply only.`;
    const res = await runClaude({ system: `${coachPrompt({ lang })}\n\n${rulesContext({ rulesText, rules })}`, prompt });
    const reply = String(res.result || '').trim();
    for (let i = 0; i < reply.length; i += 6) {
      onText(reply.slice(i, i + 6));
      await new Promise((r) => setTimeout(r, 15));
    }
    return usageOf(res);
  },

  async review({ lang, rules, rulesText, draft, title, summary, checked }) {
    const ticks = (rules.checklist || []).map((c) => `[${checked?.[c.id] ? 'x' : ' '}] ${c.label}`).join('\n');
    const prompt = `${rulesContext({ rulesText, rules })}\n\nEntry title: ${title || '(empty)'}\nSummary: ${summary || '(empty)'}\n\nSelf-check boxes:\n${ticks}\n\nDraft:\n<draft>\n${draft}\n</draft>`;
    const { data, usage } = await structured({ system: reviewPrompt({ lang }), prompt, schema: ReviewSchema });
    return { review: { items: data.items, checkedAt: new Date().toISOString() }, usage };
  },
};
