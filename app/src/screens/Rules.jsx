import React, { useState } from 'react';
import { useStore, setState, getSession, contestView } from '../store.js';
import { STR } from '../i18n.js';
import { go } from '../router.js';
import { Header, Quote, Kicker, TabBar, ErrorNote, openRules } from '../ui.jsx';
import { Loading } from './Start.jsx';
import * as api from '../api.js';
import { diffDays, fmtShort } from '../../shared/dates.js';

export default function Rules() {
  const s = useStore();
  const L = STR[s.lang];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const view = contestView(s);
  if (!view?.decoded) return null;
  const d = view.decoded;
  const today = getSession().today;
  const daysLeft = Math.max(0, diffDays(today, d.deadline.date));
  const total = d.criteria.reduce((n, c) => n + (Number(c.weight) || 0), 0) || 100;
  const maxW = Math.max(...d.criteria.map((c) => Number(c.weight) || 0), 1);

  const makePlan = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api.buildPlan({ rules: d, profile: s.profile, lang: s.lang, today, sample: view.sample && s.contest.decodedBy === 'demo' });
      setState({ plan: r.plan, lastActive: today });
      go('plan');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  if (busy) return <Loading title={L.planning} lines={[L.phase.plan, L.phase.build, L.phase.review, L.phase.submit]} />;

  return (
    <div className="page page-cream">
      <Header tone="cream" />
      <main className="rules">
        <Kicker>{L.rulesKicker}</Kicker>
        <h1 className="contest-name">{d.contestName}</h1>
        <p className="muted small">{d.organizer}</p>

        <div className="stats">
          <div>
            <b className="num">{daysLeft}</b>
            <span>{L.daysLeft}<br />{L.daysLeftLong}</span>
          </div>
          <div>
            <b className="num">{d.deliverables.length}</b>
            <span>{L.toSubmit}</span>
          </div>
          <div>
            <b className="num">{total}</b>
            <span>{L.points}</span>
          </div>
        </div>

        <section className="card card-ink">
          <h2 className="card-k lime">{L.deadline}</h2>
          <div className="deadline-big">
            {fmtShort(d.deadline.date, s.lang)} <span>{d.deadline.time}</span>
          </div>
          <p className="card-p">{d.deadline.summary}</p>
          <Quote text={d.deadline.quote} tone="dark" />
        </section>

        <section className="card">
          <h2 className="card-k">{L.whatToSubmit}</h2>
          <ol className="deliv">
            {d.deliverables.map((x, i) => (
              <li key={x.id || i}>
                <div className="deliv-head">
                  <b>{x.name}</b>
                  <span className="chip chip-outline">{x.format}</span>
                </div>
                <div className="limits">
                  {x.limits.map((l) => <span key={l} className="limit">{l}</span>)}
                </div>
                <Quote text={x.quote} compact />
              </li>
            ))}
          </ol>
        </section>

        <section className="card">
          <h2 className="card-k">{L.judging}</h2>
          <ul className="crit">
            {d.criteria.map((c) => (
              <li key={c.id}>
                <button className="crit-row" onClick={() => openRules(c.quote)}>
                  <span className="crit-name">{c.name}</span>
                  <span className="crit-w">{c.weight}<small>{L.pts}</small></span>
                  <span className="crit-bar"><i style={{ width: `${((Number(c.weight) || 0) / maxW) * 100}%` }} /></span>
                  <span className="crit-d">{c.description}</span>
                </button>
              </li>
            ))}
          </ul>
          <Quote text={d.criteria[0]?.quote} compact />
        </section>

        <section className="card card-red">
          <h2 className="card-k">{L.gotchas}</h2>
          <ul className="gotchas">
            {d.gotchas.map((g, i) => (
              <li key={i}>
                <p>{g.text}</p>
                <Quote text={g.quote} tone="red" compact />
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2 className="card-k">{L.eligibility}</h2>
          <p className="card-lead">{d.eligibility.summary}</p>
          <ul className="bullets">
            {d.eligibility.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <Quote text={d.eligibility.quote} />
        </section>

        <section className="card">
          <h2 className="card-k">{L.howToSubmit}</h2>
          <ol className="steps">
            {d.howToSubmit.steps.map((p) => <li key={p}>{p}</li>)}
          </ol>
          <Quote text={d.howToSubmit.quote} />
        </section>

        <ErrorNote error={error} onRetry={makePlan} />
        <div className="cta-space" />
      </main>
      {s.plan ? (
        <TabBar active="rules" />
      ) : (
        <div className="cta-bar">
          <button className="btn btn-ink btn-block btn-lg" onClick={makePlan}>
            {L.makePlan} <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </div>
  );
}
