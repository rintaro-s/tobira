import React, { useMemo } from 'react';
import { useStore, setState, getSession, contestView } from '../store.js';
import { STR } from '../i18n.js';
import { go } from '../router.js';
import { DoorMark, LangToggle, DemoBadge } from '../ui.jsx';
import { diffDays, fmtYMD } from '../../shared/dates.js';

// Flat confetti, hand-placed in the empty areas so it never sits on the words.
// [left %, top %, size px, rotation deg, shape, colour]
const SPOTS = [
  [62, 23.5, 14, 20, 'sq', 'ink'], [74, 21.5, 10, 0, 'ci', 'red'], [84, 24.5, 16, 35, 'tri', 'ink'], [92, 21, 9, 60, 'bar', 'red'],
  [6, 76, 16, 15, 'sq', 'ink'], [20, 81, 10, 0, 'ci', 'red'], [33, 74, 22, 80, 'bar', 'ink'], [46, 85, 14, 10, 'tri', 'cream'],
  [58, 77, 12, 45, 'sq', 'red'], [70, 88, 18, 0, 'ci', 'ink'], [83, 75, 15, 25, 'tri', 'ink'], [91, 84, 10, 70, 'sq', 'cream'],
  [12, 92, 12, 30, 'tri', 'red'], [27, 95, 18, 0, 'sq', 'cream'], [52, 93, 20, 120, 'bar', 'red'], [78, 95, 12, 15, 'sq', 'ink'],
  [40, 99, 9, 0, 'ci', 'ink'], [94, 93, 14, 50, 'tri', 'red'],
];
const PIECES = SPOTS.map(([left, top, size, rot, shape, color], i) => ({ left, top, size, rot, shape, color, delay: 1.6 + ((i * 37) % 9) / 10 }));

export default function Submitted() {
  const s = useStore();
  const L = STR[s.lang];
  const view = contestView(s);
  const plan = s.plan;
  const today = getSession().today;
  const submittedAt = s.submittedAt || today;
  const stats = useMemo(() => {
    const start = plan?.startDate || plan?.tasks?.[0]?.date || submittedAt;
    return {
      days: Math.max(1, diffDays(start, submittedAt) + 1),
      tasks: plan ? plan.tasks.filter((t) => t.status === 'done').length : 0,
      checks: s.review?.runs || 0,
    };
  }, [plan, submittedAt, s.review?.runs]);
  if (!view) return null;

  return (
    <div className="sub-stage">
      <div className="sub-door" aria-hidden>
        <div className="sub-frame">
          <div className="sub-light" />
          <div className="sub-panel"><i /></div>
        </div>
      </div>
      <div className="sub-flood" aria-hidden />
      <div className="confetti" aria-hidden>
        {PIECES.map((p, i) => (
          <i
            key={i}
            className={`cf cf-${p.shape} cf-${p.color}`}
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.shape === 'bar' ? p.size / 3 : p.size, '--rot': `${p.rot}deg`, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      <div className="sub-content">
        <div className="sub-top">
          <span className="wordmark wordmark-ink"><DoorMark size={20} open /> TOBIRA</span>
          <div className="top-right"><DemoBadge /><LangToggle /></div>
        </div>
        <div className="sub-words">
          <h1 className="sub-big">{L.submittedBig}</h1>
          <p className="sub-did">{L.iDidIt}</p>
        </div>

        <div className="entry-card">
          <div className="entry-head">
            <DoorMark size={26} open color="#C9ED77" />
            <span>{L.firstEntry}</span>
            {view.sample && <span className="chip chip-sample-dark">{L.sample}</span>}
          </div>
          {s.name ? (
            <div className="entry-name">{s.name}</div>
          ) : (
            <input className="entry-name-input" placeholder={L.yourName} onBlur={(e) => e.target.value.trim() && setState({ name: e.target.value.trim() })} />
          )}
          <div className="entry-contest">{view.decoded.contestName}</div>
          <div className="entry-stats">
            <div><b>{fmtYMD(submittedAt)}</b><span>{L.submittedOn}</span></div>
            <div><b>{stats.days}</b><span>{L.statDays}</span></div>
            <div><b>{stats.tasks}</b><span>{L.statTasks}</span></div>
            <div><b>{stats.checks}</b><span>{L.statChecks}</span></div>
          </div>
          <div className="entry-flow">
            {L.flow[0]} <i>→</i> {L.flow[1]} <i>→</i> <b>{L.flow[2]}</b>
          </div>
        </div>

        <button className="btn btn-outline-ink btn-block sub-home" onClick={() => go('today')}>{L.home}</button>
      </div>
    </div>
  );
}
