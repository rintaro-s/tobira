// Provider selection.
//   1. Demo mode forced (TOBIRA_DEMO=1, or the request asks for it, e.g. /demo/* links) -> demo
//   2. ANTHROPIC_API_KEY set                                                            -> Anthropic SDK
//   3. TOBIRA_PROVIDER=claude-cli and `claude` on PATH                                  -> claude -p
//   4. otherwise                                                                        -> demo

import { execFileSync } from 'node:child_process';
import { demoProvider } from './demo.mjs';
import { DEFAULT_MODEL } from '../../shared/pricing.js';

const DEMO_FORCED = process.env.TOBIRA_DEMO === '1';
let live = null;
let liveName = 'demo';

function hasClaudeCli() {
  try {
    execFileSync('claude', ['--version'], { stdio: 'ignore', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function initProviders() {
  if (DEMO_FORCED) return;
  if (process.env.ANTHROPIC_API_KEY) {
    live = (await import('./anthropic.mjs')).anthropicProvider;
    liveName = 'anthropic';
  } else if (process.env.TOBIRA_PROVIDER === 'claude-cli' && hasClaudeCli()) {
    live = (await import('./claude-cli.mjs')).claudeCliProvider;
    liveName = 'claude-cli';
  }
}

export function pickProvider(wantDemo) {
  if (wantDemo || !live) return demoProvider;
  return live;
}

export function status() {
  return {
    provider: live ? liveName : 'demo',
    model: live ? live.model : DEFAULT_MODEL,
    demoForced: DEMO_FORCED,
    reason: DEMO_FORCED ? 'TOBIRA_DEMO=1' : live ? null : 'no ANTHROPIC_API_KEY',
  };
}
