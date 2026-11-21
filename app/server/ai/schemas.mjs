import { z } from 'zod';

// Kept deliberately simple (no min/max/regex) so they map cleanly onto
// structured-output JSON Schema.

export const RulesSchema = z.object({
  contestName: z.string(),
  organizer: z.string(),
  theme: z.string(),
  deadline: z.object({
    date: z.string().describe('YYYY-MM-DD'),
    time: z.string().describe('HH:MM, 24h, local to the contest; empty string if not stated'),
    summary: z.string(),
    quote: z.string(),
  }),
  eligibility: z.object({ summary: z.string(), points: z.array(z.string()), quote: z.string() }),
  deliverables: z.array(
    z.object({ id: z.string(), name: z.string(), format: z.string(), limits: z.array(z.string()), quote: z.string() }),
  ),
  criteria: z.array(
    z.object({ id: z.string(), name: z.string(), weight: z.number(), description: z.string(), quote: z.string() }),
  ),
  howToSubmit: z.object({ steps: z.array(z.string()), quote: z.string() }),
  checklist: z.array(z.object({ id: z.string(), label: z.string(), quote: z.string() })),
  gotchas: z.array(z.object({ text: z.string(), quote: z.string() })),
});

export const PlanSchema = z.object({
  tasks: z.array(
    z.object({
      phase: z.enum(['plan', 'build', 'review', 'submit']),
      title: z.string(),
      why: z.string(),
      criterion: z.string(),
      minutes: z.number(),
      steps: z.array(z.string()),
      prio: z.number(),
    }),
  ),
});

export const ReviewSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['pass', 'fix']),
      title: z.string(),
      detail: z.string(),
      criterion: z.string(),
      quote: z.string(),
    }),
  ),
});
