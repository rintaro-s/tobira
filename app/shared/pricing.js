// USD per million tokens (Anthropic first-party API list prices).
// Cache writes are billed at 1.25x input, cache reads at 0.1x input.
export const PRICES = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-fable-5-2': { input: 8, output: 40 },
};

export const DEFAULT_MODEL = 'claude-opus-5-5';

export function costUsd(model, u) {
  const p = PRICES[model] || PRICES[DEFAULT_MODEL];
  const input = u.input_tokens || 0;
  const output = u.output_tokens || 0;
  const cw = u.cache_creation_input_tokens || 0;
  const cr = u.cache_read_input_tokens || 0;
  return (input * p.input + output * p.output + cw * p.input * 1.25 + cr * p.input * 0.1) / 1e6;
}

/** Rough token estimate for demo mode: ~1 token per CJK char, ~4 chars per token otherwise. */
export function estimateTokens(text) {
  const s = typeof text === 'string' ? text : JSON.stringify(text ?? '');
  const cjk = (s.match(/[　-鿿＀-￯]/g) || []).length;
  return Math.ceil(cjk + (s.length - cjk) / 4);
}

export function fmtUsd(v) {
  if (v === 0) return '$0.00';
  if (v < 0.01) return '<$0.01';
  return `$${v.toFixed(2)}`;
}
