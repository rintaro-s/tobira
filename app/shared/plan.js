// Plan math shared by the server (demo + live providers) and the client (re-planning).
// A plan is an ordered list of tasks, one per calendar day, from the start date up to
// the day before the deadline (the deadline day itself is never scheduled — the rules
// of almost every contest warn that forms are congested on the last day).

import { addDays, diffDays } from './dates.js';
import { SAMPLE_TASKS, FILLER_TASK } from './sample-tasks.js';
import { optionLabel, SKILLS, INTERESTS } from './options.js';

export const PHASES = ['plan', 'build', 'review', 'submit'];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** How many days each phase gets for an n-day plan. */
export function phaseCounts(n) {
  n = Math.max(1, n);
  if (n === 1) return { plan: 0, build: 0, review: 0, submit: 1 };
  if (n === 2) return { plan: 0, build: 0, review: 1, submit: 1 };
  if (n === 3) return { plan: 1, build: 0, review: 1, submit: 1 };
  const submit = clamp(Math.round(n * 0.1), 1, 3);
  const review = clamp(Math.round(n * 0.2), 1, 7);
  const plan = clamp(Math.round(n * 0.2), 1, 8);
  const build = n - submit - review - plan;
  return { plan, build: Math.max(1, build), review, submit };
}

function pickForPhase(lib, k, phase) {
  if (k <= 0) return [];
  if (k >= lib.length) {
    const out = [...lib];
    let i = 1;
    // fillers go before the last task of the phase so the phase still ends on its key step
    while (out.length < k) out.splice(Math.max(0, out.length - 1), 0, FILLER_TASK(phase, i++));
    return out;
  }
  // keep the k most important tasks, preserving their original order
  const ranked = lib.map((t, i) => ({ t, i })).sort((a, b) => a.t.prio - b.t.prio || a.i - b.i);
  const keep = new Set(ranked.slice(0, k).map((x) => x.i));
  return lib.filter((_, i) => keep.has(i));
}

function fill(text, vars) {
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function personalize(task, profile) {
  const vars = {};
  for (const lang of ['ja', 'en']) {
    const interest = profile?.interestsOther || (profile?.interests?.[0] ? optionLabel(INTERESTS, profile.interests[0], lang) : lang === 'ja' ? '学校や家' : 'school or home');
    const skillId = (profile?.skills || []).find((s) => s !== 'unsure');
    const skill = profile?.skillsOther || (skillId ? optionLabel(SKILLS, skillId, lang) : lang === 'ja' ? '好きなこと' : 'something you enjoy');
    vars[lang] = { interest: lang === 'ja' ? `「${interest}」` : interest.toLowerCase(), skill: lang === 'ja' ? skill : skill.toLowerCase() };
  }
  return {
    ...task,
    steps: { ja: task.steps.ja.map((s) => fill(s, vars.ja)), en: task.steps.en.map((s) => fill(s, vars.en)) },
  };
}

/**
 * Lay tasks out one per day. `tasksByPhase` maps phase -> ordered task list
 * (already the right length). Returns the dated task list.
 */
export function layoutTasks(tasksByPhase, startDate, minutesPerDay) {
  const tasks = [];
  let day = 0;
  for (const phase of PHASES) {
    for (const t of tasksByPhase[phase] || []) {
      tasks.push({
        ...t,
        phase,
        minutes: Math.min(t.minutes || minutesPerDay, minutesPerDay),
        date: addDays(startDate, day++),
        status: 'todo',
      });
    }
  }
  return tasks;
}

/** Deterministic plan for the SAMPLE contest (used by the demo provider). */
export function buildSamplePlan({ startDate, deadline, profile }) {
  const n = Math.max(1, diffDays(startDate, deadline));
  const counts = phaseCounts(n);
  const byPhase = {};
  for (const phase of PHASES) {
    const lib = SAMPLE_TASKS.filter((t) => t.phase === phase).map((t) => personalize(t, profile));
    byPhase[phase] = pickForPhase(lib, counts[phase], phase);
  }
  return {
    startDate,
    deadline,
    tasks: layoutTasks(byPhase, startDate, profile?.minutes || 30),
  };
}

/**
 * Make live-AI tasks fit the calendar exactly: trim the least important ones or
 * pad with polish days, phase by phase.
 */
export function fitTasksToCalendar(aiTasks, { startDate, deadline, minutesPerDay }) {
  const n = Math.max(1, diffDays(startDate, deadline));
  const counts = phaseCounts(n);
  const byPhase = {};
  for (const phase of PHASES) {
    const lib = aiTasks.filter((t) => t.phase === phase).map((t, i) => ({ ...t, id: t.id || `${phase}${i + 1}`, prio: t.prio || 2 }));
    byPhase[phase] = pickForPhase(lib, counts[phase], phase);
  }
  return { startDate, deadline, tasks: layoutTasks(byPhase, startDate, minutesPerDay) };
}

/**
 * Re-plan after missed days, without shame: if pending tasks are scheduled in the
 * past, spread what is left over the days that remain. When there are more tasks
 * than days, the least important ones are folded away (never the submit step).
 * Returns null when nothing needs to change.
 */
export function replan(plan, today) {
  if (!plan) return null;
  const pending = plan.tasks.filter((t) => t.status !== 'done');
  const overdue = pending.filter((t) => t.date < today);
  if (overdue.length === 0) return null;
  const daysLeft = Math.max(1, diffDays(today, plan.deadline));
  let keep = [...pending];
  let folded = 0;
  for (const prio of [3, 2, 1]) {
    while (keep.length > daysLeft) {
      // fold the latest low-priority non-submit task first
      let idx = -1;
      for (let i = keep.length - 1; i >= 0; i--) {
        if (keep[i].prio === prio && keep[i].phase !== 'submit') { idx = i; break; }
      }
      if (idx === -1) break;
      keep.splice(idx, 1);
      folded++;
    }
  }
  const done = plan.tasks.filter((t) => t.status === 'done');
  const rescheduled = keep.map((t, i) => ({ ...t, date: addDays(today, i) }));
  return {
    ...plan,
    tasks: [...done, ...rescheduled],
    replannedAt: today,
    notice: { overdue: overdue.length, folded, daysLeft },
  };
}

export function currentTask(plan, today) {
  if (!plan) return null;
  return plan.tasks.find((t) => t.status !== 'done') || null;
}

export function doneToday(plan, today) {
  return !!plan?.tasks.some((t) => t.status === 'done' && t.doneAt === today);
}

export function progress(plan) {
  if (!plan) return { done: 0, total: 0, pct: 0 };
  const done = plan.tasks.filter((t) => t.status === 'done').length;
  const total = plan.tasks.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function phaseOf(plan, today) {
  const t = currentTask(plan, today);
  return t ? t.phase : 'submit';
}
