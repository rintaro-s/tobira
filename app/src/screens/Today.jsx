import React, { useEffect, useRef, useState } from 'react';
import { useStore, setState, getSession, contestView } from '../store.js';
import { STR } from '../i18n.js';
import { go } from '../router.js';
import { Header, TabBar, CostMeter, Quote, DemoBadge, tx, openRules } from '../ui.jsx';
import { diffDays } from '../../shared/dates.js';
import { replan, currentTask, doneToday, progress } from '../../shared/plan.js';
import { coachOpening, coachQuickReplies } from '../../shared/sample-coach.js';
import * as api from '../api.js';

export default function Today() {
  const s = useStore();
  const L = STR[s.lang];
  const today = getSession().today;
  const view = contestView(s);
  const [ahead, setAhead] = useState(false);

  // Missed days? Re-plan quietly, then say hello.
  useEffect(() => {
    if (!s.plan) return;
    const next = replan(s.plan, today);
    if (next) setState({ plan: next, lastActive: today });
    else if (s.lastActive !== today && !getSession().demo) setState({ lastActive: today });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s.plan || !view) return null;
  const plan = s.plan;
  const task = currentTask(plan, today);
  const prog = progress(plan);
  const daysLeft = Math.max(0, diffDays(today, plan.deadline));
  const dayN = Math.min(plan.tasks.length, Math.max(1, diffDays(plan.startDate || plan.tasks[0].date, today) + 1));
  const totalDays = diffDays(plan.startDate || plan.tasks[0].date, plan.deadline);
  const finishedToday = doneToday(plan, today) && task && task.date > today && !ahead;
  const crit = task && view.decoded.criteria.find((c) => c.id === task.criterion);
  const showWelcome = plan.notice && plan.replannedAt === today;
  const nextTask = task && plan.tasks.find((t) => t.status !== 'done' && t.id !== task.id);

  const markDone = () => {
    setAhead(false);
    setState({
      plan: { ...plan, tasks: plan.tasks.map((t) => (t.id === task.id ? { ...t, status: 'done', doneAt: today } : t)), notice: null },
      lastActive: today,
      coach: { open: false, messages: [] },
    });
    window.scrollTo(0, 0);
  };

  const openCoach = () => {
    setState({ coach: { open: true, taskId: task.id, messages: [{ role: 'coach', text: coachOpening({ lang: s.lang, task }) }] } });
  };

  return (
    <div className="page page-cream">
      <Header />
      <section className="today-top">
        <div className="today-top-row">
          <span className="dayof">{L.dayOf(dayN, totalDays)}</span>
          <CostMeter tone="dark" />
        </div>
        <div className="today-days">
          <b className="num-xl lime">{daysLeft}</b>
          <span>
            {L.daysLeftShort}
            <br />
            <small>{L.daysLeftLabel}</small>
          </span>
          <div className="today-prog">
            <div className="bar"><i style={{ width: `${prog.pct}%` }} /></div>
            <small>{prog.done}/{prog.total}</small>
          </div>
        </div>
      </section>

      <main className="today">
        {showWelcome && (
          <div className="welcome">
            <b>{L.welcomeBack}</b>
            <p>{L.replanned(plan.notice.daysLeft, plan.notice.folded)}</p>
          </div>
        )}

        {s.submittedAt ? (
          <div className="taskcard taskcard-sub">
            <div className="bigcheck">✓</div>
            <h1 className="task-title">{L.submittedBig}</h1>
            <p>{L.iDidIt}</p>
            <button className="btn btn-ink btn-block btn-lg" onClick={() => go('submitted')}>{L.firstEntry} →</button>
          </div>
        ) : !task ? (
          <div className="taskcard taskcard-done">
            <div className="bigcheck">✓</div>
            <h1 className="task-title">{L.allDone}</h1>
            <button className="btn btn-ink btn-block btn-lg" onClick={() => go('review')}>{L.goReview} →</button>
          </div>
        ) : finishedToday ? (
          <div className="taskcard taskcard-done">
            <div className="bigcheck">✓</div>
            <h1 className="task-title">{L.doneToday}</h1>
            <p className="muted">{L.doneTodaySub}</p>
            <div className="peek">
              <span className="peek-k">{L.tomorrow}</span>
              <b>{tx(task.title, s.lang)}</b>
            </div>
            <button className="btn btn-ghost-ink btn-block" onClick={() => setAhead(true)}>{L.workAhead} →</button>
          </div>
        ) : (
          <article className="taskcard">
            <div className="task-k">
              <span>{L.todaysTask}</span>
              <span className={`phase-chip ph-${task.phase}`}>{L.phase[task.phase]}</span>
            </div>
            <h1 className="task-title">{tx(task.title, s.lang)}</h1>
            <div className="task-meta">
              <span className="mins"><b>{task.minutes}</b>{L.min}</span>
              {crit && (
                <button className="crit-chip" onClick={() => openRules(crit.quote)}>
                  {crit.name} <b>{crit.weight}{L.pts}</b>
                </button>
              )}
            </div>
            <ol className="task-steps">
              {(tx(task.steps, s.lang) || []).map((st, i) => <li key={i}>{st}</li>)}
            </ol>
            <div className="why">
              <span className="why-k">{L.whyMatters}</span>
              <p>{tx(task.why, s.lang)}</p>
            </div>
            <div className="task-actions">
              <button className="btn btn-lime btn-block btn-xl done-btn" onClick={markDone}>
                <span aria-hidden>✓</span> {L.done}
              </button>
              <button className="btn btn-outline-ink btn-block btn-lg" onClick={openCoach}>{L.stuck}</button>
            </div>
          </article>
        )}

        {task && nextTask && !finishedToday && !s.submittedAt && (
          <div className="peek peek-line">
            <span className="peek-k">{L.nextUp}</span>
            <span>{tx(nextTask.title, s.lang)}</span>
          </div>
        )}
        <div className="cta-space" />
      </main>
      <TabBar active="today" />
      {s.coach.open && task && !s.submittedAt && <Coach task={task} />}
    </div>
  );
}

// ── coach ──────────────────────────────────────────────────────────
function CoachText({ text, lang }) {
  const lines = text.split('\n');
  const body = [];
  let rule = null;
  for (const l of lines) {
    const m = l.match(/^\s*RULE:\s*(.+)$/);
    if (m) rule = m[1].trim();
    else body.push(l);
  }
  return (
    <>
      <p>{body.join('\n').trim()}</p>
      {rule && <Quote text={rule} compact />}
    </>
  );
}

function Coach({ task }) {
  const s = useStore();
  const L = STR[s.lang];
  const view = contestView(s);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [err, setErr] = useState(false);
  const endRef = useRef(null);
  const msgs = s.coach.messages;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length, msgs[msgs.length - 1]?.text]);

  const close = () => setState({ coach: { ...s.coach, open: false } });

  const send = async (text) => {
    const q = text.trim();
    if (!q || streaming) return;
    setInput('');
    setErr(false);
    const history = [...msgs, { role: 'user', text: q }];
    setState({ coach: { ...s.coach, messages: [...history, { role: 'coach', text: '', pending: true }] } });
    setStreaming(true);
    let acc = '';
    const update = (pending) => setState((st) => ({ coach: { ...st.coach, messages: [...history, { role: 'coach', text: acc, pending }] } }));
    try {
      await api.coach(
        {
          lang: s.lang,
          task,
          messages: history.map(({ role, text: tt }) => ({ role, text: tt })),
          deadline: s.plan.deadline,
          today: getSession().today,
          sample: view.sample && s.contest.decodedBy === 'demo',
          rules: view.decoded,
          rulesText: view.rulesText,
        },
        (chunk) => {
          acc += chunk;
          update(true);
        },
      );
      update(false);
    } catch {
      setErr(true);
      setState((st) => ({ coach: { ...st.coach, messages: history } }));
    } finally {
      setStreaming(false);
    }
  };

  const quick = coachQuickReplies(s.lang);
  return (
    <div className="coach" role="dialog" aria-modal="true" aria-label={L.coach}>
      <div className="coach-head">
        <div>
          <b>{L.coach}</b>
          <span>{tx(task.title, s.lang)}</span>
        </div>
        <div className="coach-head-r">
          <DemoBadge />
          <button className="x" onClick={close} aria-label={L.close}>×</button>
        </div>
      </div>
      <p className="coach-note">{L.coachNote}</p>
      <div className="coach-body">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role === 'user' ? 'me' : 'them'}`}>
            {m.role === 'user' ? <p>{m.text}</p> : m.pending && !m.text ? <span className="typing"><i /><i /><i /></span> : <CoachText text={m.text} lang={s.lang} />}
          </div>
        ))}
        {err && <p className="note-warn">{L.coachError}</p>}
        <div ref={endRef} />
      </div>
      <div className="coach-foot">
        <div className="quick">
          {quick.map((q) => (
            <button key={q} onClick={() => send(q)} disabled={streaming}>{q}</button>
          ))}
        </div>
        <form className="coach-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={L.coachPlaceholder} />
          <button className="btn btn-lime" disabled={!input.trim() || streaming}>{L.send}</button>
        </form>
      </div>
    </div>
  );
}
