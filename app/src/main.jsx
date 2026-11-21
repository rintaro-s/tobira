import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/m-plus-1p/400.css';
import '@fontsource/m-plus-1p/500.css';
import '@fontsource/m-plus-1p/700.css';
import '@fontsource/m-plus-1p/800.css';
import './styles.css';
import { boot, useStore, getSession } from './store.js';
import { usePath, screenOf, go } from './router.js';
import { RulesSheet } from './ui.jsx';
import Start from './screens/Start.jsx';
import Rules from './screens/Rules.jsx';
import Plan from './screens/Plan.jsx';
import Today from './screens/Today.jsx';
import Review from './screens/Review.jsx';
import Submitted from './screens/Submitted.jsx';
import Cohort from './screens/Cohort.jsx';

boot();
if (getSession().still) document.documentElement.classList.add('still');

const SCREENS = { start: Start, rules: Rules, plan: Plan, today: Today, stuck: Today, back: Today, review: Review, submitted: Submitted };

function App() {
  const path = usePath();
  const s = useStore();
  let screen = screenOf(path);
  if (screen === 'demo' || screen === '') screen = s.submittedAt ? 'submitted' : s.plan ? 'today' : s.contest ? 'rules' : 'start';

  // Guard: screens that need data fall back to the right step.
  let target = screen;
  if (screen !== 'cohort' && screen !== 'start' && SCREENS[screen]) {
    if (!s.contest) target = 'start';
    else if (!s.plan && !['rules', 'plan'].includes(screen)) target = 'rules';
    else if (screen === 'plan' && !s.plan) target = 'rules';
  }
  useEffect(() => {
    if (target !== screen) go(target);
  }, [target, screen]);

  useEffect(() => {
    document.title = screen === 'cohort' ? 'TOBIRA — Pilot dashboard' : 'TOBIRA';
  }, [screen]);

  if (screen === 'cohort') return <Cohort />;
  const Screen = SCREENS[target] || Start;
  return (
    <>
      <Screen screen={target} />
      <RulesSheet />
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
