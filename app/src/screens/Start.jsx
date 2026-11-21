import React, { useEffect, useRef, useState } from 'react';
import { useStore, setState, getSession, isDemo } from '../store.js';
import { STR } from '../i18n.js';
import { go } from '../router.js';
import { Header, ErrorNote, Kicker } from '../ui.jsx';
import * as api from '../api.js';
import { SKILLS, INTERESTS, MINUTES } from '../../shared/options.js';
import { addDays } from '../../shared/dates.js';
import { SAMPLE_DAYS, sampleRulesText } from '../../shared/sample.js';

// The decode request runs while the student answers the three questions.
let pending = null;

function startDecode({ sample, rulesText, lang }) {
  const today = getSession().today;
  const deadline = sample ? addDays(today, SAMPLE_DAYS) : null;
  const text = sample ? sampleRulesText(lang, deadline) : rulesText;
  const job = { done: false, error: null, result: null, sample, deadline, rulesText: text, lang };
  job.promise = api
    .parseRules({ rulesText: text, lang, sample, deadline, today })
    .then((r) => { job.result = r; })
    .catch((e) => { job.error = e; })
    .finally(() => { job.done = true; });
  pending = job;
  return job;
}

function commit(job) {
  const r = job.result;
  setState({
    contest: {
      sample: job.sample,
      deadline: r.rules.deadline?.date || job.deadline,
      decodedBy: r.provider,
      rulesText: job.rulesText,
      decoded: r.rules,
      lang: job.lang,
    },
    plan: null,
    submittedAt: null,
    review: { draft: '', title: '', summary: '', checked: {}, result: null, runs: 0 },
    coach: { open: false, messages: [] },
  });
}

export default function Start() {
  const s = useStore();
  const L = STR[s.lang];
  const [step, setStep] = useState('door');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [note, setNote] = useState(null);
  const [error, setError] = useState(null);

  const begin = (sample) => {
    setError(null);
    if (!sample && isDemo()) {
      setNote(L.demoOnlySample);
      return;
    }
    startDecode({ sample, rulesText: text, lang: s.lang });
    setStep('q1');
  };

  const doFetch = async () => {
    setFetching(true);
    setNote(null);
    try {
      const r = await api.fetchUrl(url);
      setText(r.text);
    } catch {
      setNote(L.fetchFailed);
    } finally {
      setFetching(false);
    }
  };

  const finish = async () => {
    setStep('loading');
    const job = pending;
    if (!job) return setStep('door');
    await job.promise;
    if (job.error) {
      setError(job.error);
      setStep('door');
      return;
    }
    commit(job);
    go('rules');
  };

  if (step === 'door') {
    return (
      <div className="page page-ink">
        <Header showSample={false} />
        <main className="start">
          <Kicker tone="lime">{L.heroKicker}</Kicker>
          <h1 className="hero">
            {L.heroTitle[0]}
            <br />
            <span className="lime">{L.heroTitle[1]}</span>
          </h1>
          <div className="flowline" aria-label={L.flow.join(' → ')}>
            <span>{L.flow[0]}</span>
            <i>→</i>
            <span>{L.flow[1]}</span>
            <i>→</i>
            <span className="lime">{L.flow[2]}</span>
          </div>

          <button className="btn btn-lime btn-xl sample-btn" onClick={() => begin(true)}>
            <span className="sample-btn-main">
              {L.trySample} <span aria-hidden>→</span>
            </span>
            <span className="sample-btn-sub">
              <span className="chip chip-ink">{L.sample}</span> {L.trySampleSub}
            </span>
          </button>

          <div className="or"><span>{L.or}</span></div>

          <label className="field-label" htmlFor="rules">{L.pasteLabel}</label>
          <textarea id="rules" className="paste" value={text} onChange={(e) => setText(e.target.value)} placeholder={L.pastePlaceholder} rows={4} />
          <div className="url-row">
            <input className="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={L.urlPlaceholder} inputMode="url" />
            <button className="btn btn-outline-cream" disabled={!url.trim() || fetching} onClick={doFetch}>
              {fetching ? L.fetching : L.fetch}
            </button>
          </div>
          <button className="btn btn-outline-lime btn-block" disabled={!text.trim()} onClick={() => begin(false)}>
            {L.decode} <span aria-hidden>→</span>
          </button>
          {note && <p className="note-warn">{note}</p>}
          <ErrorNote error={error} />
        </main>
      </div>
    );
  }

  if (step === 'loading') return <Loading lines={L.readingSteps} title={L.reading} />;

  const n = step === 'q1' ? 1 : step === 'q2' ? 2 : 3;
  const p = s.profile;
  const toggle = (key, id) => {
    const cur = p[key] || [];
    setState({ profile: { ...p, [key]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } });
  };

  return (
    <div className="page page-cream">
      <Header tone="cream" showSample={false} />
      <main className="quiz">
        <div className="quiz-progress">
          {[1, 2, 3].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}
          <span>{L.q} {n}/3</span>
        </div>
        {n === 1 && (
          <>
            <h1 className="q-title">{L.q1}</h1>
            <p className="q-sub">{L.q1Sub}</p>
            <div className="chips">
              {SKILLS.map((o) => (
                <button key={o.id} className={`pick ${p.skills.includes(o.id) ? 'on' : ''}`} onClick={() => toggle('skills', o.id)}>{o[s.lang]}</button>
              ))}
            </div>
            <input className="input" value={p.skillsOther} placeholder={L.other} onChange={(e) => setState({ profile: { ...p, skillsOther: e.target.value } })} />
          </>
        )}
        {n === 2 && (
          <>
            <h1 className="q-title">{L.q2}</h1>
            <p className="q-sub">{L.q2Sub}</p>
            <div className="minutes">
              {MINUTES.map((m) => (
                <button key={m} className={`minute ${p.minutes === m ? 'on' : ''}`} onClick={() => setState({ profile: { ...p, minutes: m } })}>
                  <b>{m}</b>
                  <span>{L.minPerDay}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {n === 3 && (
          <>
            <h1 className="q-title">{L.q3}</h1>
            <p className="q-sub">{L.q3Sub}</p>
            <div className="chips">
              {INTERESTS.map((o) => (
                <button key={o.id} className={`pick ${p.interests.includes(o.id) ? 'on' : ''}`} onClick={() => toggle('interests', o.id)}>{o[s.lang]}</button>
              ))}
            </div>
            <input className="input" value={p.interestsOther} placeholder={L.other} onChange={(e) => setState({ profile: { ...p, interestsOther: e.target.value } })} />
          </>
        )}
        <div className="quiz-actions">
          <button className="btn btn-ghost-ink" onClick={() => setStep(n === 1 ? 'door' : `q${n - 1}`)}>{L.back}</button>
          <button className="btn btn-ink btn-grow" onClick={() => (n < 3 ? setStep(`q${n + 1}`) : finish())}>
            {n < 3 ? L.next : L.makeItMine} <span aria-hidden>→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export function Loading({ title, lines }) {
  const [k, setK] = useState(0);
  const timer = useRef(null);
  useEffect(() => {
    timer.current = setInterval(() => setK((x) => Math.min(x + 1, lines.length)), 420);
    return () => clearInterval(timer.current);
  }, [lines.length]);
  return (
    <div className="page page-ink loading">
      <div className="loading-door" aria-hidden>
        <i />
      </div>
      <h1 className="loading-title">{title}<span className="dots"><b>.</b><b>.</b><b>.</b></span></h1>
      <ul className="loading-lines">
        {lines.map((l, i) => (
          <li key={l} className={i < k ? 'on' : ''}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
