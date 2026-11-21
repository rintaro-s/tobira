import React, { useEffect, useRef } from 'react';
import { useStore, getSession, contestView, resetAll } from '../store.js';
import { STR } from '../i18n.js';
import { go } from '../router.js';
import { Header, Kicker, TabBar, tx } from '../ui.jsx';
import { diffDays, fmtShort } from '../../shared/dates.js';
import { PHASES, currentTask } from '../../shared/plan.js';
import { describeProfile } from '../../shared/options.js';

export default function Plan() {
  const s = useStore();
  const L = STR[s.lang];
  const today = getSession().today;
  const view = contestView(s);
  const todayRef = useRef(null);
  const firstVisit = !s.plan?.tasks.some((t) => t.status === 'done');
  useEffect(() => {
    if (!firstVisit && todayRef.current) todayRef.current.scrollIntoView({ block: 'center' });
  }, [firstVisit]);
  if (!s.plan || !view) return null;
  const { tasks, deadline } = s.plan;
  const daysLeft = Math.max(0, diffDays(today, deadline));
  const cur = currentTask(s.plan, today);
  const counts = Object.fromEntries(PHASES.map((p) => [p, tasks.filter((t) => t.phase === p).length]));
  const prof = describeProfile(s.profile, s.lang);
  const doneN = tasks.filter((t) => t.status === 'done').length;
  const dayIndex = Math.max(0, diffDays(s.plan.startDate || tasks[0].date, today));
  const markerPct = Math.min(100, (dayIndex / Math.max(1, tasks.length)) * 100);

  return (
    <div className="page page-ink">
      <Header />
      <main className="plan">
        <Kicker tone="lime">{L.planKicker}</Kicker>
        <div className="plan-hero">
          <b className="num-xl lime">{daysLeft}</b>
          <div>
            <span className="plan-hero-l">{s.lang === 'ja' ? '日' : 'days'}</span>
            <span className="plan-hero-s">{L.planSub(`${fmtShort(deadline, s.lang)} ${view.decoded.deadline.time || ''}`)}</span>
          </div>
        </div>

        <div className="phasebar" aria-hidden>
          {PHASES.filter((p) => counts[p]).map((p) => (
            <div key={p} className={`seg ${cur?.phase === p ? 'on' : ''}`} style={{ flexGrow: counts[p] }}>
              <span>{L.phase[p]}</span>
            </div>
          ))}
          <i className="marker" style={{ left: `${markerPct}%` }} />
        </div>
        <div className="phase-legend">
          {PHASES.filter((p) => counts[p]).map((p, i) => (
            <span key={p}>
              {i > 0 && <i>→</i>}
              {L.phaseEn[p]}
            </span>
          ))}
        </div>

        <p className="plan-meta">
          {prof.skills.length > 0 && <><b>{L.youCan}</b> {prof.skills.map((k, i) => <span key={k} className="seg-n">{k}{i < prof.skills.length - 1 ? (s.lang === 'ja' ? '・' : ', ') : ''}</span>)}{" "}<span className="sep">/</span>{" "}</>}
          <span className="seg-n">{L.perDay(prof.minutes)}</span>{" "}<span className="sep">/</span>{" "}<span className="seg-n">{doneN}/{tasks.length}</span>
        </p>

        {PHASES.filter((p) => counts[p]).map((p) => (
          <section key={p} className="tl-phase">
            <h2 className="tl-h">
              <span>{L.phase[p]}</span>
              <small>{L.days(counts[p])}</small>
            </h2>
            <ol className="tl">
              {tasks.filter((t) => t.phase === p).map((t) => {
                const isCur = cur && t.id === cur.id;
                const cls = t.status === 'done' ? 'done' : isCur ? 'cur' : t.date < today ? 'late' : '';
                return (
                  <li key={t.id} className={cls} ref={isCur ? todayRef : null}>
                    <span className="tl-date">{fmtShort(t.date, s.lang)}</span>
                    <span className="tl-dot" />
                    <span className="tl-title">
                      {isCur && <em>{L.todayMark}</em>}
                      {tx(t.title, s.lang)}
                    </span>
                    <span className="tl-min">{t.minutes}{s.lang === 'ja' ? '分' : 'm'}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <button className="linkish" onClick={() => { if (window.confirm(L.startOverConfirm)) { resetAll(); go('start'); } }}>{L.startOver}</button>
        <div className="cta-space" />
      </main>
      {firstVisit && !doneN ? (
        <div className="cta-bar cta-bar-ink">
          <button className="btn btn-lime btn-block btn-lg" onClick={() => go('today')}>
            {L.goToday} <span aria-hidden>→</span>
          </button>
        </div>
      ) : (
        <TabBar active="plan" />
      )}
    </div>
  );
}
