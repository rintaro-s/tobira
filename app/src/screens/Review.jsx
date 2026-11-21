import React, { useState } from 'react';
import { useStore, setState, getSession, contestView, isDemo } from '../store.js';
import { STR } from '../i18n.js';
import { go } from '../router.js';
import { Header, TabBar, Kicker, Quote, ErrorNote, CostMeter, tx } from '../ui.jsx';
import { countChars } from '../../shared/sample-review.js';
import { sampleDraft } from '../../shared/sample-review.js';
import * as api from '../api.js';

export default function Review() {
  const s = useStore();
  const L = STR[s.lang];
  const view = contestView(s);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!view) return null;
  const d = view.decoded;
  const r = s.review;
  const result = r.result;
  const fixes = result ? result.items.filter((i) => i.status === 'fix') : [];
  const passes = result ? result.items.filter((i) => i.status === 'pass') : [];
  const green = result && fixes.length === 0;
  const checklist = d.checklist || [];
  const sampleDemo = view.sample && s.contest.decodedBy === 'demo';
  const critName = (id) => d.criteria.find((c) => c.id === id);

  const patch = (p) => setState({ review: { ...r, ...p } });

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const out = await api.review({
        lang: s.lang,
        rules: d,
        rulesText: view.rulesText,
        draft: r.draft,
        title: r.title,
        summary: r.summary,
        checked: r.checked,
        deadline: s.contest.deadline,
        sample: sampleDemo,
      });
      setState((st) => ({ review: { ...st.review, result: out.review, runs: (st.review.runs || 0) + 1 } }));
      window.scrollTo({ top: 0, behavior: getSession().still ? 'auto' : 'smooth' });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const submitted = () => {
    setState({ submittedAt: getSession().today, plan: s.plan && { ...s.plan, tasks: s.plan.tasks.map((t) => (t.phase === 'submit' && t.prio <= 2 ? { ...t, status: 'done', doneAt: t.doneAt || getSession().today } : t)) } });
    go('submitted');
  };

  const Item = ({ it }) => {
    const c = it.criterion && critName(it.criterion);
    return (
      <li className={`ri ri-${it.status}`}>
        <span className="ri-icon" aria-hidden>{it.status === 'pass' ? '✓' : '!'}</span>
        <div className="ri-main">
          <b>{tx(it.title, s.lang)}</b>
          <p>{tx(it.detail, s.lang)}</p>
          <div className="ri-foot">
            {c && <span className="crit-chip small">{c.name} <b>{c.weight}{L.pts}</b></span>}
          </div>
          {it.status === 'fix' && <Quote text={tx(it.quote, s.lang)} compact />}
        </div>
      </li>
    );
  };

  return (
    <div className="page page-cream">
      <Header tone="cream" />
      <main className="review">
        <Kicker>{L.reviewKicker}</Kicker>
        <h1 className="h1">{L.reviewTitle}</h1>

        {result ? (
          <>
            <div className={`verdict ${green ? 'verdict-green' : 'verdict-red'}`}>
              {green ? (
                <>
                  <b className="num-l">✓</b>
                  <div>
                    <strong>{L.allClear}</strong>
                    <span>{L.allClearSub}</span>
                  </div>
                </>
              ) : (
                <>
                  <b className="num-l">{fixes.length}</b>
                  <div>
                    <strong>{s.lang === 'ja' ? `${L.toFix}${fixes.length}${L.toFixUnit}` : `${fixes.length} ${L.toFixUnit}`}</strong>
                    <span>{L.passN(passes.length)}</span>
                  </div>
                </>
              )}
            </div>
            {green && (
              <div className="submit-box">
                <button className="btn btn-lime btn-block btn-xl" onClick={submitted}>
                  {L.iSubmitted}
                </button>
                <p className="muted small">{L.iSubmittedNote}</p>
              </div>
            )}
            <ul className="ri-list">
              {fixes.map((it) => <Item key={it.id} it={it} />)}
              {passes.map((it) => <Item key={it.id} it={it} />)}
            </ul>
          </>
        ) : (
          <p className="muted">{L.notCheckedYet}</p>
        )}

        <section className="draft">
          <h2 className="h2">{L.yourDraft}</h2>
          <label className="field">
            <span>{L.entryTitle} <em className={countChars(r.title) > 30 ? 'over' : ''}>{countChars(r.title)}/30</em></span>
            <input className="input" value={r.title} onChange={(e) => patch({ title: e.target.value })} />
          </label>
          <label className="field">
            <span>{L.entrySummary} <em className={countChars(r.summary) > 200 ? 'over' : ''}>{countChars(r.summary)}/200</em></span>
            <textarea className="input" rows={3} value={r.summary} onChange={(e) => patch({ summary: e.target.value })} />
          </label>
          <label className="field">
            <span>{L.draft}</span>
            <textarea className="input draft-ta" rows={8} value={r.draft} placeholder={L.draftPlaceholder} onChange={(e) => patch({ draft: e.target.value })} />
          </label>
          {sampleDemo && isDemo() && (
            <button className="linkish" onClick={() => patch({ draft: sampleDraft(s.lang, 2) })}>{L.loadRevised}</button>
          )}
          {checklist.length > 0 && (
            <fieldset className="checks">
              <legend>{L.checklist}</legend>
              {checklist.map((c) => (
                <label key={c.id} className="check">
                  <input type="checkbox" checked={!!r.checked[c.id]} onChange={(e) => patch({ checked: { ...r.checked, [c.id]: e.target.checked } })} />
                  <span className="box" aria-hidden />
                  <span>{c.label}</span>
                </label>
              ))}
            </fieldset>
          )}
          <ErrorNote error={error} onRetry={run} />
          <button className="btn btn-ink btn-block btn-lg" onClick={run} disabled={busy}>
            {busy ? L.checking : result ? L.recheck : L.checkIt}
          </button>
          <div className="center"><CostMeter /></div>
        </section>
        <div className="cta-space" />
      </main>
      <TabBar active="review" />
    </div>
  );
}
