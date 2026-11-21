import React, { useMemo, useState } from 'react';
import { useStore, getSession } from '../store.js';
import { STR } from '../i18n.js';
import { DoorMark, LangToggle, tx } from '../ui.jsx';
import { addDays, diffDays } from '../../shared/dates.js';
import { SAMPLE_DAYS, sampleMeta } from '../../shared/sample.js';
import { buildSamplePlan } from '../../shared/plan.js';
import { fmtUsd } from '../../shared/pricing.js';

// SAMPLE DATA. Ten fictional first-time entrants, day 24 of a proposed 4-week pilot.
// All dates are relative to today so the screen never goes stale.
const PILOT_DAY = 24;
const STUDENTS = [
  { ja: 'あおい', en: 'Aoi', done: 26, last: 0, sub: 1, mentor: 25, ai: 1.42 },
  { ja: '蒼太', en: 'Sota', done: 25, last: 1, sub: 3, mentor: 15, ai: 0.96 },
  { ja: '結衣', en: 'Yui', done: 27, last: 0, sub: 0, mentor: 40, ai: 1.88 },
  { ja: '大翔', en: 'Hiroto', done: 21, last: 0, sub: null, mentor: 35, ai: 1.21 },
  { ja: '美咲', en: 'Misaki', done: 12, last: 4, sub: null, mentor: 55, ai: 0.74 },
  { ja: '陽斗', en: 'Haruto', done: 20, last: 1, sub: null, mentor: 20, ai: 1.05 },
  { ja: '莉子', en: 'Riko', done: 26, last: 2, sub: 2, mentor: 30, ai: 1.33 },
  { ja: '悠真', en: 'Yuma', done: 9, last: 3, sub: null, mentor: 45, ai: 0.52 },
  { ja: '花音', en: 'Kanon', done: 17, last: 0, sub: null, mentor: 25, ai: 1.12 },
  { ja: '湊', en: 'Minato', done: 15, last: 1, sub: null, mentor: 20, ai: 0.9 },
];

const KEY = 'tobira.cohort.mentor';
function loadExtra() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export default function Cohort() {
  const s = useStore();
  const L = STR[s.lang];
  const today = getSession().today;
  const [extra, setExtra] = useState(() => (getSession().demo ? {} : loadExtra()));
  const start = addDays(today, -(PILOT_DAY - 1));
  const deadline = addDays(start, SAMPLE_DAYS);
  const plan = useMemo(() => buildSamplePlan({ startDate: start, deadline, profile: { minutes: 30, interests: ['school'], skills: [] } }), [start, deadline]);
  const meta = sampleMeta(s.lang);

  const rows = STUDENTS.map((st, i) => {
    const submitted = st.sub !== null;
    const stuck = !submitted && st.last >= 2;
    const task = submitted ? null : plan.tasks[st.done];
    const mentor = st.mentor + (extra[i] || 0);
    return { ...st, i, submitted, stuck, task, mentor, phase: submitted ? 'submit' : task?.phase || 'submit' };
  });
  const nSub = rows.filter((r) => r.submitted).length;
  const nStuck = rows.filter((r) => r.stuck).length;
  const mentorMin = rows.reduce((n, r) => n + r.mentor, 0);
  const ai = rows.reduce((n, r) => n + r.ai, 0);
  const total = plan.tasks.length;

  const log = (i) => {
    const next = { ...extra, [i]: (extra[i] || 0) + 10 };
    setExtra(next);
    if (!getSession().demo) {
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };
  const last = (n) => (n === 0 ? L.today : L.daysAgo(n));

  return (
    <div className="cohort">
      <div className="sample-band" role="note">
        <b>{L.sampleData.toUpperCase()}</b>
        <span>{L.sampleDataLong}</span>
      </div>
      <header className="co-head">
        <div className="co-brand">
          <span className="wordmark"><DoorMark size={22} open /> TOBIRA</span>
          <span className="co-title">{L.cohortTitle}</span>
        </div>
        <div className="co-right">
          <span className="chip chip-red">{L.sampleData}</span>
          <LangToggle />
        </div>
      </header>

      <section className="co-sub">
        <div>
          <div className="co-contest">
            {meta.name} <span className="chip chip-sample">{L.sample}</span>
          </div>
          <div className="co-line">{L.pilotLine}</div>
        </div>
        <div className="co-day">
          <b>{L.pilotDay(PILOT_DAY, SAMPLE_DAYS)}</b>
          <div className="bar"><i style={{ width: `${(PILOT_DAY / SAMPLE_DAYS) * 100}%` }} /></div>
        </div>
      </section>

      <section className="kpis">
        <div className="kpi kpi-lime">
          <span>{L.kSubmitted}<em>{L.sample}</em></span>
          <b>{nSub}<small>/10</small></b>
        </div>
        <div className="kpi kpi-red">
          <span>{L.kStuck}<em>{L.sample}</em></span>
          <b>{nStuck}</b>
        </div>
        <div className="kpi">
          <span>{L.kSupport}<em>{L.sample}</em></span>
          <b>{(mentorMin / 60).toFixed(1)}<small>{L.hours}</small></b>
        </div>
        <div className="kpi">
          <span>{L.kAi}<em>{L.sample}</em></span>
          <b>{fmtUsd(ai)}</b>
        </div>
        <div className="kpi">
          <span>{L.kPerSub}<em>{L.sample}</em></span>
          <b>{nSub ? fmtUsd(ai / nSub) : '—'}</b>
        </div>
      </section>

      <section className="co-table-wrap">
        <table className="co-table">
          <thead>
            <tr>
              <th>{L.cStudent}</th>
              <th>{L.cStatus}</th>
              <th>{L.cPhase}</th>
              <th>{L.cProgress}</th>
              <th>{L.cTask}</th>
              <th>{L.cLast}</th>
              <th className="r">{L.cMentor}</th>
              <th className="r">{L.cAi}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.i} className={r.stuck ? 'is-stuck' : r.submitted ? 'is-sub' : ''}>
                <td className="name">
                  <span className="avatar">{r[s.lang].slice(0, 1)}</span>
                  {r[s.lang]}
                </td>
                <td>
                  {r.stuck ? (
                    <span className="flag flag-stuck">{L.sStuck}<small>{L.stuckFor(r.last)}</small></span>
                  ) : r.submitted ? (
                    <span className="flag flag-sub">✓ {L.sSubmitted}</span>
                  ) : (
                    <span className="flag flag-ok">{L.sOnTrack}</span>
                  )}
                </td>
                <td><span className={`phase-chip ph-${r.phase}`}>{L.phase[r.phase]}</span></td>
                <td>
                  <div className="prog">
                    <div className="bar"><i style={{ width: `${((r.submitted ? Math.max(r.done, total - 1) : r.done) / total) * 100}%` }} /></div>
                    <small>{r.done}/{total}</small>
                  </div>
                </td>
                <td className="task">{r.task ? tx(r.task.title, s.lang) : '—'}</td>
                <td className={r.last >= 2 && !r.submitted ? 'warn' : ''}>{last(r.last)}</td>
                <td className="r">
                  <span className="mins">{r.mentor}{s.lang === 'ja' ? '分' : ' min'}</span>
                  <button className="log" onClick={() => log(r.i)}>{L.logTime}</button>
                </td>
                <td className="r mono">{fmtUsd(r.ai)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="co-foot">{L.cohortFoot}</p>
    </div>
  );
}
