// Demo-provider review. These are real, deterministic checks of the student's draft
// against the SAMPLE contest's rules (sections present, AI-use note, no names in the
// body, page estimate, title/summary length, self-check boxes). Nothing is invented:
// every "pass" is earned by what is actually on the page.

import { sampleQuote } from './sample.js';

const both = (deadline, key) => ({ ja: sampleQuote('ja', deadline, key), en: sampleQuote('en', deadline, key) });

const SECTIONS = [
  { id: 'background', re: /課題の背景|背景|background/i, ja: '課題の背景', en: 'Background', criterion: 'problem' },
  { id: 'idea', re: /解決アイデア|アイデア|solution idea|\bidea\b/i, ja: '解決アイデア', en: 'Solution idea', criterion: 'originality' },
  { id: 'build', re: /実現方法|how it will be built|how we will build|how it works|implementation/i, ja: '実現方法', en: 'How it will be built', criterion: 'feasibility' },
  { id: 'test', re: /検証の計画|検証|testing plan|test plan|\btesting\b/i, ja: '検証の計画', en: 'Testing plan', criterion: 'feasibility' },
];

const AI_NOTE = /生成AI|AIの利用|AI利用|use of (generative )?ai|ai use|generative ai|used ai/i;
const NAME_MARKER = /(氏名|名前|作成者?|学校名|所属)\s*[:：]|\b(name|author|school|written by)\s*:/i;
const SCENE = /\d|朝|放課後|昼休み|夜|雨|毎日|毎朝|先週|昨日|when|every|morning|after school|yesterday|last week|rain/i;

export function countChars(s) {
  return [...(s || '').replace(/\s/g, '')].length;
}

export function estimatePages(draft) {
  const text = draft || '';
  const cjk = (text.match(/[　-鿿＀-￯]/g) || []).length;
  const words = text.replace(/[　-鿿＀-￯]/g, ' ').split(/\s+/).filter(Boolean).length;
  // ~800 Japanese characters or ~350 English words per page with figures; +1 for the cover
  return 1 + Math.max(1, Math.ceil(cjk / 800 + words / 350));
}

export function demoReview({ deadline, draft = '', title = '', summary = '', checked = {}, checklist = [] }) {
  const items = [];
  const push = (id, status, criterion, quote, ja, en) => items.push({ id, status, criterion, quote, title: { ja: ja[0], en: en[0] }, detail: { ja: ja[1], en: en[1] } });
  const text = draft.trim();

  if (!text) {
    push('draft', 'fix', null, both(deadline, 'sections'),
      ['下書きがまだ貼り付けられていない', '企画書の文章をそのまま貼り付けてね。途中でも大丈夫。'],
      ['No draft pasted yet', 'Paste your proposal text as it is now. Unfinished is fine.']);
  } else {
    const missing = SECTIONS.filter((s) => !s.re.test(text));
    for (const s of missing) {
      const hint = s.id === 'test'
        ? ['誰に・何を試して・何が分かれば成功か、を3行で。「実現可能性」25点に直結するよ。', 'Three lines: who tries it, what they do, and what result means success. This feeds straight into Feasibility (25 pts).']
        : ['必須の4項目の1つ。見出しを入れて、まず3行だけ書こう。', 'One of the four required sections. Add the heading and write three lines to start.'];
      push(`section-${s.id}`, 'fix', s.criterion, both(deadline, 'sections'),
        [`「${s.ja}」の項目がまだない`, hint[0]],
        [`The “${s.en}” section is missing`, hint[1]]);
    }
    if (missing.length === 0) {
      push('sections', 'pass', null, both(deadline, 'sections'),
        ['必須の4項目がそろっている', '課題の背景・解決アイデア・実現方法・検証の計画。'],
        ['All four required sections are there', 'Background, Solution idea, How it will be built, Testing plan.']);
    }

    const bgMatch = text.match(/(課題の背景|背景|background)[\s\S]{0,400}/i);
    if (bgMatch && SCENE.test(bgMatch[0])) {
      push('scene', 'pass', 'problem', both(deadline, 'c1'),
        ['背景に具体的な場面がある', 'いつ・どこで・誰が困ったかが見える。「課題設定の鋭さ」（25点）の土台。'],
        ['Your background has a concrete scene', 'It shows when, where and who. That is the base of “Sharpness of the problem” (25 pts).']);
    } else if (bgMatch) {
      push('scene', 'fix', 'problem', both(deadline, 'c1'),
        ['背景がまだ抽象的', '「いつ」「どこで」を1つずつ足そう。例：雨の日の放課後、昇降口で。'],
        ['The background is still abstract', 'Add one “when” and one “where”. For example: on a rainy afternoon, at the school entrance.']);
    }

    if (AI_NOTE.test(text)) {
      push('ai', 'pass', null, both(deadline, 'ai'),
        ['AIの利用について書いてある', '最終ページにあるか、PDFにする時にもう一度確認しよう。'],
        ['AI use is declared', 'Double-check it lands on the last page when you export the PDF.']);
    } else {
      push('ai', 'fix', null, both(deadline, 'ai'),
        ['AIの利用について書かれていない', 'TOBIRAのコーチを使ったなら、それも生成AIの利用。最終ページに「どこで・何に使ったか」を書こう。'],
        ['AI use is not declared', 'If you used TOBIRA’s coach, that counts as generative AI. Add “where and how” on the last page.']);
    }

    if (NAME_MARKER.test(text)) {
      push('anon', 'fix', null, both(deadline, 'anon'),
        ['本文に名前・学校名らしき行がある', '「氏名：」「作成：」などの行は表紙だけに。本文からは消そう。'],
        ['A name or school line appears in the body', 'Lines like “Name:” or “Author:” belong on the cover only. Remove them from the body.']);
    } else {
      push('anon', 'pass', null, both(deadline, 'anon'),
        ['本文に名前・学校名の行は見当たらない', 'PDFのファイル名にも入れないように。'],
        ['No name or school lines in the body', 'Keep them out of the PDF file name too.']);
    }

    const pages = estimatePages(text);
    push('pages', pages <= 10 ? 'pass' : 'fix', 'clarity', both(deadline, 'proposal'),
      [pages <= 10 ? `分量は約${pages}ページ（表紙込み）の見込み` : `約${pages}ページになりそう（上限10）`, pages <= 10 ? '図を入れても10ページ以内に収まりそう。' : '一番長い項目を半分にしよう。図1枚は文章1ページより伝わる。'],
      [pages <= 10 ? `Roughly ${pages} pages including the cover` : `Looks like about ${pages} pages (limit: 10)`, pages <= 10 ? 'Room for figures within the 10-page limit.' : 'Halve your longest section. One figure says more than a page of text.']);
  }

  const tLen = countChars(title);
  if (!tLen) {
    push('title', 'fix', 'clarity', both(deadline, 'form'), ['作品タイトルが空', '30文字以内で。'], ['No title yet', '30 characters or fewer.']);
  } else {
    push('title', tLen <= 30 ? 'pass' : 'fix', 'clarity', both(deadline, 'form'),
      [`タイトル ${tLen}/30文字`, tLen <= 30 ? '制限内。' : `${tLen - 30}文字けずろう。`],
      [`Title ${tLen}/30 characters`, tLen <= 30 ? 'Within the limit.' : `Cut ${tLen - 30} characters.`]);
  }
  const sLen = countChars(summary);
  if (!sLen) {
    push('summary', 'fix', 'clarity', both(deadline, 'form'), ['作品概要が空', '200字以内で。審査員が最初に読む文章。'], ['No summary yet', '200 characters or fewer. It’s the first thing judges read.']);
  } else {
    push('summary', sLen <= 200 ? 'pass' : 'fix', 'clarity', both(deadline, 'form'),
      [`概要 ${sLen}/200字`, sLen <= 200 ? '制限内。' : `${sLen - 200}字けずろう。`],
      [`Summary ${sLen}/200 characters`, sLen <= 200 ? 'Within the limit.' : `Cut ${sLen - 200} characters.`]);
  }

  for (const c of checklist) {
    if (!checked[c.id]) {
      push(`check-${c.id}`, 'fix', null, c.quoteBoth || { ja: c.quote, en: c.quote },
        [`未確認：${c.labelBoth?.ja ?? c.label}`, '終わったらチェックを入れよう。'],
        [`Not confirmed: ${c.labelBoth?.en ?? c.label}`, 'Tick it once it’s done.']);
    }
  }
  const doneChecks = checklist.filter((c) => checked[c.id]).length;
  if (checklist.length && doneChecks === checklist.length) {
    push('checks', 'pass', null, both(deadline, 'proposal'),
      [`提出物のチェック ${doneChecks}/${checklist.length}`, '形式の条件はすべて確認済み。'],
      [`Deliverables check ${doneChecks}/${checklist.length}`, 'Every format requirement confirmed.']);
  }

  items.sort((a, b) => (a.status === b.status ? 0 : a.status === 'fix' ? -1 : 1));
  return { items, checkedAt: new Date().toISOString() };
}

export const SAMPLE_TITLE = { ja: '傘まちがえゼロ・クリップ', en: 'Zero Mix-up Umbrella Clips' };
export const SAMPLE_SUMMARY = {
  ja: '雨の日の放課後、似た傘が並ぶ昇降口で、自分の傘が見つからない・間違えて持ち帰ってしまう。そんな困りごとを、3Dプリンタで作る「形と色のしるしクリップ」で解決します。遠くからでも自分の傘が分かり、雨でもはがれません。',
  en: 'On rainy afternoons, students can’t find their umbrella among dozens of identical ones, or take the wrong one. Our 3D-printed shape-and-colour clips make any umbrella easy to spot.',
};

const V1 = {
  ja: `傘まちがえゼロ・クリップ

■ 課題の背景
雨の日の放課後、昇降口の傘立てには同じようなビニール傘が何十本も並ぶ。先週の木曜日、自分の傘が見つからず、10分探したあげく濡れて帰った。クラスで聞くと、12人中7人が「今月、傘を間違えられた・間違えた」と答えた。間違えた人にも悪気はなく、見分けがつかないだけだった。
・誰が：傘立てを使う生徒（特に1年生）
・いつ：雨の日の放課後、昇降口が混む5分間
・どう困る：自分の傘が分からない／間違えて持って帰ってしまう

■ 解決アイデア
傘の柄に付ける「しるしクリップ」を3Dプリンタで作る。形（星・波・三角など8種類）と色（学年ごと）を組み合わせて、遠くからでも自分の傘が分かるようにする。名前シールと違って雨でもはがれず、遠目でも見分けられるのが特徴。クリップを付けた傘だけを置ける「しるし傘立て」の列を作り、置き場所も覚えやすくする。

■ 実現方法
1. 3D CADでクリップを設計する（柄の太さ18〜25mmに対応）
2. 学校の3Dプリンタで8種類×3色を試作する
3. 昇降口の傘立て1列に「しるしクリップ専用」の表示をつける
難しいのは、太さの違う柄に付けられること。バネのように開く形にして対応する。`,
  en: `Zero Mix-up Umbrella Clips

■ Background
On rainy afternoons, the umbrella stand at our school entrance holds dozens of near-identical clear umbrellas. Last Thursday I couldn’t find mine, searched for 10 minutes, and walked home soaked. When I asked my class, 7 out of 12 said someone had taken their umbrella, or they had taken the wrong one, this month. Nobody meant to. They just couldn’t tell them apart.
- Who: students who use the umbrella stand (especially first-years)
- When: the 5 busy minutes at the entrance after school on rainy days
- How it hurts: you can’t find your umbrella, or you take the wrong one home

■ Solution idea
3D-printed “marker clips” that attach to an umbrella handle. Combining a shape (8 kinds: star, wave, triangle…) with a colour (one per year group) makes your umbrella recognisable from a distance. Unlike name stickers, they don’t peel off in the rain and you can spot them from far away. One row of the stand becomes a “marker row” for clipped umbrellas, so it’s easy to remember where yours is.

■ How it will be built
1. Design the clip in 3D CAD (fits handles 18–25 mm thick)
2. Print 8 shapes × 3 colours on the school’s 3D printer
3. Label one row of the entrance stand “marker clips only”
The hard part is fitting handles of different thicknesses. A spring-like opening shape should solve it.`,
};

const V2_ADD = {
  ja: `

■ 検証の計画
雨の日を3回使って、1年生の1クラス（30人）に試してもらう。
・成功の目安：傘の取り違えと「探す時間」がほぼゼロになること
・確かめ方：放課後の5分間、昇降口で傘を探している人の数を数える。使った人に一言アンケート
・試作1号を友達2人に付けてもらったら「遠くからでも分かる」と言われた。一方で細い柄からは外れやすかったので、つめの形を直す。

■ 生成AIの利用について
・TOBIRA（AIコーチ）：計画づくりとルールの確認に使用。質問に答えながら自分で考え、文章はすべて自分で書いた。`,
  en: `

■ Testing plan
Over three rainy days, one first-year class (30 students) will try the clips.
- Success looks like: almost no mix-ups and almost no time spent searching
- How we’ll check: count people searching for umbrellas during the 5 minutes after school, plus a one-question survey
- I gave prototype #1 to two friends. They said “you can spot it from far away”, but it slipped off thin handles, so I’m redesigning the grip.

■ Use of generative AI
- TOBIRA (AI coach): used for planning and for checking the rules. It asked me questions; I did the thinking and wrote every sentence myself.`,
};

export function sampleDraft(lang, version = 1) {
  return version === 2 ? V1[lang] + V2_ADD[lang] : V1[lang];
}
