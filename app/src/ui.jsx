import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { useStore, setState, getSession, getServer, isDemo, contestView, totalCost } from './store.js';
import { STR } from './i18n.js';
import { go } from './router.js';
import { fmtUsd } from '../shared/pricing.js';

export const tx = (v, lang) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v.ja ?? v.en : v);

// ── door mark ───────────────────────────────────────────────────────
export function DoorMark({ size = 22, open = false, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" fill="none" stroke={color} strokeWidth="2.6" />
      {open ? <path d="M5.3 3.3 L13 5.5 V21 L5.3 20.7 Z" fill={color} /> : <rect x="5.3" y="3.3" width="13.4" height="17.4" fill={color} opacity="0" />}
      <rect x={open ? 10.6 : 14.5} y="11" width="2.2" height="2.6" fill={color} />
    </svg>
  );
}

export function Wordmark({ dark = true }) {
  return (
    <span className="wordmark">
      <DoorMark size={20} open />
      <span>TOBIRA</span>
    </span>
  );
}

// ── header ──────────────────────────────────────────────────────────
export function LangToggle() {
  const s = useStore();
  const set = (lang) => {
    setState({ lang });
    document.documentElement.lang = lang;
  };
  return (
    <div className="lang" role="group" aria-label="Language">
      <button className={s.lang === 'ja' ? 'on' : ''} onClick={() => set('ja')}>JA</button>
      <button className={s.lang === 'en' ? 'on' : ''} onClick={() => set('en')}>EN</button>
    </div>
  );
}

export function DemoBadge() {
  const s = useStore();
  if (!isDemo()) return null;
  return (
    <span className="chip chip-demo" title={STR[s.lang].demoModeLong}>
      <i className="dot" /> {STR[s.lang].demoMode}
    </span>
  );
}

export function Header({ tone = 'ink', showSample = true }) {
  const s = useStore();
  const L = STR[s.lang];
  const sample = showSample && s.contest?.sample;
  return (
    <header className={`top top-${tone}`}>
      <button className="brand" onClick={() => go(s.plan ? 'today' : 'start')} aria-label="TOBIRA">
        <Wordmark />
      </button>
      <div className="top-right">
        {sample && <span className="chip chip-sample">{L.sample}</span>}
        <DemoBadge />
        <LangToggle />
      </div>
    </header>
  );
}

// ── tab bar ─────────────────────────────────────────────────────────
const ICONS = {
  today: <path d="M4 12.5 9.5 18 20 6.5" fill="none" stroke="currentColor" strokeWidth="2.6" />,
  plan: <g fill="currentColor"><rect x="3" y="5" width="18" height="2.6" /><rect x="3" y="10.7" width="12" height="2.6" /><rect x="3" y="16.4" width="7" height="2.6" /></g>,
  rules: <g fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="5" y="3" width="14" height="18" /><path d="M8.5 8h7M8.5 12h7M8.5 16h4" /></g>,
  review: <g fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></g>,
};

export function TabBar({ active }) {
  const s = useStore();
  const L = STR[s.lang];
  return (
    <nav className="tabs">
      {['today', 'plan', 'rules', 'review'].map((k) => (
        <button key={k} className={active === k ? 'on' : ''} onClick={() => go(k)}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">{ICONS[k]}</svg>
          <span>{L.tabs[k]}</span>
        </button>
      ))}
    </nav>
  );
}

// ── cost meter ──────────────────────────────────────────────────────
export function CostMeter({ tone = 'light' }) {
  const s = useStore();
  const L = STR[s.lang];
  const total = totalCost(s);
  const estimated = s.usage.some((u) => u.estimated);
  return (
    <div className={`meter meter-${tone}`} title={estimated ? L.demoModeLong : ''}>
      <span>{L.aiCost}</span>
      <b>{fmtUsd(total)}</b>
      {estimated && <em>{L.est}</em>}
      <span className="meter-n">· {s.usage.length} calls</span>
    </div>
  );
}

// ── quote + rules sheet ─────────────────────────────────────────────
const sheetListeners = new Set();
let sheet = { open: false, quote: '' };
const setSheet = (v) => { sheet = v; sheetListeners.forEach((l) => l()); };
export const openRules = (quote) => setSheet({ open: true, quote });
export const useSheet = () => useSyncExternalStore((l) => (sheetListeners.add(l), () => sheetListeners.delete(l)), () => sheet);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Locate a quote in the rules: exact first, then whitespace-tolerant. */
export function findQuote(text, quote) {
  if (!text || !quote) return null;
  const q = quote.trim();
  const i = text.indexOf(q);
  if (i >= 0) return [i, i + q.length];
  try {
    const re = new RegExp(esc(q).replace(/\s+/g, '\\s*'));
    const m = re.exec(text);
    if (m) return [m.index, m.index + m[0].length];
  } catch {
    /* ignore */
  }
  return null;
}

export function Quote({ text, tone = 'light', compact = false }) {
  const s = useStore();
  const L = STR[s.lang];
  const view = contestView(s);
  if (!text) return null;
  const found = !!findQuote(view?.rulesText, text);
  return (
    <button className={`quote quote-${tone} ${compact ? 'quote-compact' : ''}`} onClick={() => openRules(text)}>
      {!compact && <span className="quote-k">{L.fromRules}</span>}
      <span className="quote-t">“{text}”</span>
      <span className="quote-go">
        {L.showInRules} <span aria-hidden>→</span>
      </span>
      {!found && <span className="quote-warn">{L.notVerbatim}</span>}
    </button>
  );
}

export function RulesSheet() {
  const s = useStore();
  const sh = useSheet();
  const L = STR[s.lang];
  const markRef = useRef(null);
  const view = contestView(s);
  useEffect(() => {
    if (sh.open && markRef.current) markRef.current.scrollIntoView({ block: 'center' });
  }, [sh.open, sh.quote]);
  if (!sh.open || !view) return null;
  const text = view.rulesText || '';
  const at = findQuote(text, sh.quote);
  return (
    <div className="sheet" role="dialog" aria-modal="true">
      <div className="sheet-head">
        <b>{L.officialRules}</b>
        <button className="x" onClick={() => setSheet({ open: false, quote: '' })} aria-label={L.close}>×</button>
      </div>
      <div className="sheet-body">
        <pre className="rules-text">
          {at ? (
            <>
              {text.slice(0, at[0])}
              <mark ref={markRef}>{text.slice(at[0], at[1])}</mark>
              {text.slice(at[1])}
            </>
          ) : (
            text
          )}
        </pre>
      </div>
    </div>
  );
}

export function Kicker({ children, tone }) {
  return <div className={`kicker ${tone ? `kicker-${tone}` : ''}`}>{children}</div>;
}

export function useStill() {
  return getSession().still;
}

export function ErrorNote({ error, onRetry }) {
  const s = useStore();
  const L = STR[s.lang];
  if (!error) return null;
  const msg = error.code === 'demo-unsupported' ? L.demoOnlySample : error.code === 'refusal' ? L.errRefusal : error.code?.startsWith('api') ? L.errOffline : L.errGeneric;
  return (
    <div className="err">
      <p>{msg}</p>
      <div className="err-actions">
        {onRetry && <button className="btn btn-sm btn-ink" onClick={onRetry}>{L.retry}</button>}
        {error.code?.startsWith('api') && getServer().provider !== 'demo' && !s.demoMode && (
          <button className="btn btn-sm btn-ghost" onClick={() => setState({ demoMode: true })}>{L.useDemo}</button>
        )}
      </div>
    </div>
  );
}
