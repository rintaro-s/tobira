// Handwritten coach for the demo provider. The coach plans, asks questions and points
// back to the rules. It never writes the entry. Replies may end with a line
// "RULE: <exact sentence from the official rules>", which the UI renders as a quote chip.

import { sampleQuote } from './sample.js';
import { diffDays } from './dates.js';

const tx = (v, lang) => (v && typeof v === 'object' ? v[lang] ?? v.ja ?? v.en : v);

const CRITERION_QUESTION = {
  problem: {
    ja: 'その困りごとが最後に起きたのはいつ？誰が、どこで、何をしていた？3行の箇条書きで十分。',
    en: 'When did it last happen? Who was there, and where? Three bullet points is plenty.',
  },
  originality: {
    ja: 'いまある方法だと、どこが一番面倒？その「面倒」を逆さまにすると、どんな形になる？',
    en: 'With the ways people deal with this today, what is the most annoying part? What would it look like if you flipped that annoyance upside down?',
  },
  feasibility: {
    ja: '明日、30分で試せる一番小さい形は何？紙とテープだけで作るとしたら？',
    en: 'What is the smallest version you could try tomorrow in 30 minutes? What if you only had paper and tape?',
  },
  clarity: {
    ja: '初めて聞く友達に10秒で説明するなら、最初の一言は何にする？',
    en: 'If you had 10 seconds to explain this to a friend who has never heard of it, what would your first sentence be?',
  },
  reach: {
    ja: '同じことで困っていそうな人を、自分以外に1人思い浮かべられる？その人はどこにいる？',
    en: 'Can you picture one other person, besides you, who has this same trouble? Where are they?',
  },
  rules: {
    ja: 'ルールのカードで、この作業に関係しそうなのはどれだと思う？一緒に1枚だけ見てみよう。',
    en: 'Which rule card do you think this task connects to? Let’s look at just one together.',
  },
};

const CRITERION_QUOTE_KEY = { problem: 'c1', originality: 'c2', feasibility: 'c3', clarity: 'c4', reach: 'c5', rules: 'sections' };

const CRITERION_NAME = {
  problem: { ja: '課題設定の鋭さ', en: 'Sharpness of the problem', w: 25 },
  originality: { ja: '独創性', en: 'Originality', w: 25 },
  feasibility: { ja: '実現可能性', en: 'Feasibility', w: 25 },
  clarity: { ja: '伝わりやすさ', en: 'Clarity', w: 15 },
  reach: { ja: '広がり', en: 'Reach', w: 10 },
};

const PATTERNS = {
  writeForMe: /書いて|代わりに|かわりに|作って|つくって|考えて(くれ|ほしい|よ)|やって(くれ|ほしい)|答え(を)?教えて|write (it|this|that|mine|the)|for me|do it|just give|can you write|make it for/i,
  time: /時間|忙し|いそがし|疲れ|つかれ|部活|テスト|眠|no time|busy|tired|exam|club|sleepy/i,
  unsure: /合って|正しい|これでいい|大丈夫|不安|自信|right\?|correct|good enough|is this ok|okay\?|not sure if/i,
  idea: /アイデア|思いつかない|似て|ありきたり|普通すぎ|idea|original|boring|similar|already exists/i,
  start: /何から|なにから|分から|わから|どこから|どうすれば|start|where do i|don.?t know|no idea|stuck|how do i/i,
};

export function coachOpening({ lang, task }) {
  return lang === 'ja'
    ? `ここはみんなよく止まる所。大丈夫。\nいちばん近いのはどれ？「何から書くか分からない」「時間がない」「合ってるか不安」。`
    : `Lots of people stop right here. That’s okay.\nWhich is closest: “I don’t know where to start”, “no time today”, or “not sure it’s right”?`;
}

export function coachQuickReplies(lang) {
  return lang === 'ja'
    ? ['何から書けばいいか分からない', '代わりに書いてくれない？', '時間がない', 'これで合ってる？']
    : ['I don’t know what to write first', 'Can you just write it for me?', 'I don’t have time today', 'Is this right?'];
}

/** Pick a reply for the latest student message. Deterministic. */
export function coachReply({ lang, task, messages, deadline, today }) {
  const userMsgs = (messages || []).filter((m) => m.role === 'user');
  const last = userMsgs[userMsgs.length - 1]?.text || '';
  const crit = task?.criterion && CRITERION_QUESTION[task.criterion] ? task.criterion : 'rules';
  const steps = tx(task?.steps, lang) || [];
  const first = steps[0] || (lang === 'ja' ? '最初の一歩' : 'the first step');
  const lastStep = steps[steps.length - 1] || first;
  const q = (key) => sampleQuote(lang, deadline, key);
  const cn = CRITERION_NAME[crit];
  const daysLeft = deadline && today ? Math.max(0, diffDays(today, deadline)) : null;
  const ja = lang === 'ja';

  if (PATTERNS.writeForMe.test(last)) {
    return ja
      ? `そこは、あなたの言葉で書くところ。審査員が見たいのは、あなたが見つけた困りごとだから。\nでも、ひとりにはしないよ。思い出せる場面を1つ、話し言葉で教えて。どこで、誰が、何に困ってた？\nRULE: ${q('ai')}`
      : `That part has to be in your words. The judges want the problem you noticed, and the rules ask you to declare any AI use.\nBut I’m right here. Tell me one scene, however messy: where were you, and what went wrong?\nRULE: ${q('ai')}`;
  }
  if (PATTERNS.time.test(last)) {
    return ja
      ? `今日は10分だけにしよう。「${first}」ができたら、今日は完了でいい。\n残りは明日以降に回せるよ。締切まであと${daysLeft ?? '数'}日。1日休んでも、TOBIRAが計画を組み直すから大丈夫。`
      : `Let’s make today a 10-minute day. If you do just “${first}”, today counts as done.\nThe rest can move to later days. You still have ${daysLeft ?? 'several'} days, and if you miss one, TOBIRA re-plans for you.`;
  }
  if (PATTERNS.unsure.test(last)) {
    return ja
      ? `確かめ方は2つあるよ。①ルールのカードと見比べる。②審査基準で自分に点をつけてみる。\n「${cn ? cn.ja : 'ルール'}」の基準を読んで、いまの下書きは5段階でいくつだと思う？理由も1行で教えて。\nRULE: ${q(CRITERION_QUOTE_KEY[crit])}`
      : `There are two ways to check. One: compare it with the rule cards. Two: score yourself against the judging criteria.\nRead the “${cn ? cn.en : 'rules'}” criterion. On a scale of 1–5, where is your draft right now? Give me one line on why.\nRULE: ${q(CRITERION_QUOTE_KEY[crit])}`;
  }
  if (PATTERNS.idea.test(last)) {
    return ja
      ? `アイデアは「困りごとをどれだけ細かく見たか」から出てくることが多いよ。\nその困りごとの中で、一番イライラする“瞬間”はどこ？その1秒だけを消すとしたら、何ができそう？\nRULE: ${q('c2')}`
      : `Ideas usually come from how closely you’ve looked at the problem.\nWhat is the single most frustrating *moment* in this trouble? If you could erase just that one second, what could you make?\nRULE: ${q('c2')}`;
  }
  if (PATTERNS.start.test(last) || userMsgs.length <= 1) {
    return ja
      ? `まず「${first}」だけやろう。きれいな文章じゃなくていい。\n${CRITERION_QUESTION[crit].ja}\nRULE: ${q(CRITERION_QUOTE_KEY[crit])}`
      : `Start with just “${first}”. It doesn’t have to be polished.\n${CRITERION_QUESTION[crit].en}\nRULE: ${q(CRITERION_QUOTE_KEY[crit])}`;
  }
  const n = userMsgs.length % 3;
  if (n === 2) {
    return ja
      ? `いいね、そこまで言葉にできたのは前進だよ。\nいま話してくれたことの中で、一番「これは本当」と言える1文はどれ？それを企画書のその項目の1行目にしてみよう。`
      : `Nice. Putting that into words is real progress.\nOf everything you just told me, which one sentence are you most sure is true? Try making it the first line of that section.`;
  }
  if (n === 0) {
    return ja
      ? `${CRITERION_QUESTION[crit].ja}\nRULE: ${q(CRITERION_QUOTE_KEY[crit])}`
      : `${CRITERION_QUESTION[crit].en}\nRULE: ${q(CRITERION_QUOTE_KEY[crit])}`;
  }
  return ja
    ? `今日の作業は、あとは「${lastStep}」まで。終わったら「完了」を押そう。続きは明日のあなたに任せていい。`
    : `For today, you only need to get to “${lastStep}”. When you’re there, tap Done. Tomorrow-you can take it from here.`;
}

/** The fixed exchange shown on /demo/stuck. */
export function seededStuckExchange({ lang, task, deadline, today }) {
  const u1 = lang === 'ja' ? '何から書けばいいか分からない' : 'I don’t know what to write first';
  const u2 = lang === 'ja' ? '代わりに書いてくれない？' : 'Can you just write it for me?';
  const msgs = [{ role: 'coach', text: coachOpening({ lang, task }) }, { role: 'user', text: u1 }];
  msgs.push({ role: 'coach', text: coachReply({ lang, task, messages: msgs, deadline, today }) });
  msgs.push({ role: 'user', text: u2 });
  msgs.push({ role: 'coach', text: coachReply({ lang, task, messages: msgs, deadline, today }) });
  return msgs;
}
