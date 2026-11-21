// The SAMPLE contest. Entirely fictional: the contest, the organiser, the
// address and the e-mail domain (.example is reserved) do not exist.
//
// Every date in the rules is derived from the deadline, and the deadline is
// derived from "today", so the demo never goes stale.
//
// Every quote used by the decoded cards is a named constant that is also
// spliced into the rules text, so "show me where this came from" always finds
// the exact sentence.

import { addDays, fmtJaLong, fmtEnLong, fmtMonthDay } from './dates.js';

export const SAMPLE_ID = 'sample-komichi-2026';
export const SAMPLE_DAYS = 28; // a fresh start is four weeks before the deadline

function quotes(lang, deadline) {
  const rev = addDays(deadline, -35);
  if (lang === 'ja') {
    return {
      deadline: `応募締切：${fmtJaLong(deadline)} 23:59（日本時間）必着`,
      late: '締切を過ぎた応募は、理由のいかんを問わず受け付けません。',
      eligibility: '2026年度に日本国内の高等専門学校、高等学校または中等教育学校（後期課程）に在籍する学生・生徒。',
      team: '個人またはチーム（3名以内）で応募できます。チームで応募する場合は、指導教員1名の登録が必要です。',
      oneEntry: '1人（1チーム）につき応募は1作品までとします。',
      minor: '応募者が18歳未満の場合は、保護者の同意を得たうえで応募してください。',
      proposal: '企画書：A4縦・PDF形式、表紙を含めて10ページ以内、ファイルサイズ10MB以下。',
      sections: '企画書には「課題の背景」「解決アイデア」「実現方法」「検証の計画」の4項目を必ず含めてください。',
      video: '紹介動画：3分以内（MP4形式）。YouTubeに「限定公開」でアップロードし、そのURLを応募フォームに記載してください。',
      videoChange: `※${fmtMonthDay(rev, 'ja')}一部改訂：紹介動画の長さを「5分以内」から「3分以内」に変更しました。`,
      form: '応募フォーム：作品タイトル（30文字以内）、作品概要（200字以内）、応募者情報、指導教員情報を入力してください。',
      missing: 'いずれかが欠けている場合は審査対象外となることがあります。',
      criteria: '審査は以下の5つの観点で行います（100点満点）。',
      c1: '(1) 課題設定の鋭さ（25点）：身近な課題を具体的に捉え、誰が・いつ・どう困っているかが明確であるか。',
      c2: '(2) 独創性（25点）：既存の方法にない新しい視点や工夫があるか。',
      c3: '(3) 実現可能性（25点）：実際に試作・検証する道筋が示されているか。',
      c4: '(4) 伝わりやすさ（15点）：企画書と動画で、初めて読む人にも内容が伝わるか。',
      c5: '(5) 広がり（10点）：同じ課題を持つ他の人や地域にも役立つ可能性があるか。',
      how: '公式サイトの応募フォームから、企画書PDFのアップロードと動画URLの入力を行ってください。',
      confirm: '応募完了後、登録したメールアドレスに受付確認メールが届きます。24時間以内に届かない場合は事務局までお問い合わせください。',
      replace: '提出後の差し替えは、締切前に限り1回まで可能です。',
      anon: '審査の公平性のため、企画書の本文（表紙を除く）には学校名・氏名を記載しないでください。',
      ai: '生成AIの利用は認めますが、利用した場合は企画書の最終ページに「生成AIの利用箇所と用途」を明記してください。',
      copyright: '第三者の著作物（画像・音楽・映像など）を使用する場合は、権利者の許諾を得るか、利用規約で認められた素材のみを使用してください。',
      busy: '締切直前は応募フォームへのアクセスが集中するおそれがあります。余裕をもって提出してください。',
      unfinished: '完成品である必要はありません。アイデアの段階から歓迎します。',
    };
  }
  return {
    deadline: `Entry deadline: ${fmtEnLong(deadline)}, 23:59 JST (entries must arrive by this time)`,
    late: 'Entries received after the deadline will not be accepted for any reason.',
    eligibility: 'Students enrolled in academic year 2026 at a college of technology (kosen), a high school, or a secondary school (upper division) in Japan.',
    team: 'You may enter individually or as a team of up to three. Teams must register one supervising teacher.',
    oneEntry: 'Each person (or team) may submit only one entry.',
    minor: 'Applicants under 18 must obtain a parent or guardian’s consent before entering.',
    proposal: 'Proposal: A4 portrait, PDF format, no more than 10 pages including the cover, file size 10 MB or less.',
    sections: 'The proposal must include all four sections: "Background of the problem", "Solution idea", "How it will be built", and "Testing plan".',
    video: 'Introduction video: 3 minutes or shorter (MP4). Upload it to YouTube as "Unlisted" and enter the URL in the entry form.',
    videoChange: `*Revised on ${fmtMonthDay(rev, 'en')}: the video length limit has changed from "5 minutes or shorter" to "3 minutes or shorter".`,
    form: 'Entry form: enter a title (30 characters or fewer), a summary (200 characters or fewer), applicant details, and supervising teacher details.',
    missing: 'Entries missing any of these may not be judged.',
    criteria: 'Entries are judged on the following five criteria (100 points in total).',
    c1: '(1) Sharpness of the problem (25 pts): Does the entry capture a familiar problem concretely, making clear who struggles, when, and how?',
    c2: '(2) Originality (25 pts): Does it bring a new perspective or approach not found in existing solutions?',
    c3: '(3) Feasibility (25 pts): Does it show a realistic path to building and testing a prototype?',
    c4: '(4) Clarity (15 pts): Can a first-time reader understand it from the proposal and the video?',
    c5: '(5) Reach (10 pts): Could it help other people or communities with the same problem?',
    how: 'Use the entry form on the official website to upload your proposal PDF and enter your video URL.',
    confirm: 'Once your entry is complete, a confirmation e-mail will be sent to your registered address. If it does not arrive within 24 hours, contact the secretariat.',
    replace: 'You may replace your submission once, and only before the deadline.',
    anon: 'To keep judging fair, do not write your school name or personal names in the body of the proposal (the cover page is excluded).',
    ai: 'Generative AI may be used, but if you use it, state "where and how generative AI was used" on the last page of the proposal.',
    copyright: 'If you use third-party works (images, music, video, etc.), obtain permission from the rights holder or use only material whose license allows it.',
    busy: 'The entry form may be congested just before the deadline. Please submit with time to spare.',
    unfinished: 'Your idea does not need to be finished. Ideas at an early stage are welcome.',
  };
}

export function sampleMeta(lang) {
  return lang === 'ja'
    ? { name: '第3回 こみちアイデアコンテスト 2026', short: 'こみちアイデアコンテスト', organizer: 'こみちアイデアコンテスト実行委員会（架空）', theme: '身近な“ちょっと困った”を、技術でほどく。' }
    : { name: 'The 3rd Komichi Ideas Contest 2026', short: 'Komichi Ideas Contest', organizer: 'Komichi Ideas Contest Committee (fictional)', theme: 'Untangle an everyday "small trouble" with technology.' };
}

/** Full, realistically long and slightly messy official rules text. */
export function sampleRulesText(lang, deadline) {
  const q = quotes(lang, deadline);
  const m = sampleMeta(lang);
  const pub = addDays(deadline, -62);
  const rev = addDays(deadline, -35);
  const res1 = addDays(deadline, 24);
  const fin = addDays(deadline, 45);
  if (lang === 'ja') {
    return `【SAMPLE／これは架空のコンテストです】
${m.name}
募集要項（高専・高校生の部）

主催：${m.organizer}
公開日：${fmtJaLong(pub)}　最終更新：${fmtJaLong(rev)}

■ はじめに
本コンテストは、全国の高専生・高校生が、身の回りの課題を自分の手で解決する経験を応援するために開催します。昨年度は全国から多数の応募があり、初めて応募する方の作品も多く入賞しました。

■ 1. 募集テーマ
「${m.theme}」
家庭・学校・地域など、身の回りで見つけた小さな困りごとを、ものづくり、プログラミング、デザインなどの技術を使って解決するアイデアを募集します。${q.unfinished}

■ 2. 応募資格
${q.eligibility}
${q.team}
${q.oneEntry}
${q.minor}
※過去に他のコンテスト等で入賞した作品と同一の内容での応募はできません（改良・発展させたものは可）。

■ 3. 応募締切
${q.deadline}
${q.late}
※郵送での応募は受け付けていません。

■ 4. 提出物
次の(1)〜(3)すべてを提出してください。${q.missing}
(1) ${q.proposal}
　　${q.sections}
　　・図や写真、手書きのスケッチの使用も可能です。
(2) ${q.video}
　　${q.videoChange}
　　・スマートフォンでの撮影で構いません。編集の巧拙は審査の対象外です。
(3) ${q.form}

■ 5. 審査
${q.criteria}
${q.c1}
${q.c2}
${q.c3}
${q.c4}
${q.c5}
一次審査（書類・動画）の結果は${fmtJaLong(res1)}頃に応募者全員へメールで通知します。一次審査通過者には、${fmtJaLong(fin)}にオンラインで開催する最終審査会でプレゼンテーション（5分）を行っていただきます。

■ 6. 応募方法
${q.how}
${q.confirm}
${q.replace}

■ 7. 注意事項
・${q.anon}
・${q.ai}
・${q.copyright}
・応募作品の著作権は応募者に帰属します。ただし、主催者は広報のために作品タイトル・概要・動画の一部を使用できるものとします。
・${q.busy}
・応募に係る費用（通信費等）は応募者の負担とします。
・ご記入いただいた個人情報は、本コンテストの運営以外の目的には使用しません。

■ 8. 表彰
最優秀賞（1件）：賞状、副賞（3万円相当の図書カード）
優秀賞（2件）：賞状、副賞（1万円相当の図書カード）
アイデア賞（若干数）：賞状
※副賞の内容は変更になる場合があります。

■ 9. お問い合わせ
こみちアイデアコンテスト事務局（架空）
メール：entry@komichi-contest.example
（お問い合わせはメールのみで受け付けます。土日祝日は返信できません。）`;
  }
  return `[SAMPLE — this is a fictional contest]
${m.name}
Call for Entries (College of Technology & High School Division)

Organizer: ${m.organizer}
Published: ${fmtEnLong(pub)}   Last updated: ${fmtEnLong(rev)}

■ Introduction
This contest supports students at colleges of technology and high schools across Japan in solving problems around them with their own hands. Last year we received many entries from all over the country, and many prize winners were entering for the first time.

■ 1. Theme
"${m.theme}"
We are looking for ideas that use making, programming, design, or other technology to solve a small problem you have found at home, at school, or in your community. ${q.unfinished}

■ 2. Eligibility
${q.eligibility}
${q.team}
${q.oneEntry}
${q.minor}
*Entries identical to work that has already won a prize in another contest are not accepted (improved or extended versions are fine).

■ 3. Deadline
${q.deadline}
${q.late}
*Entries by post are not accepted.

■ 4. What to submit
Submit all of items (1) to (3) below. ${q.missing}
(1) ${q.proposal}
    ${q.sections}
    - Diagrams, photos, and hand-drawn sketches are welcome.
(2) ${q.video}
    ${q.videoChange}
    - Filming on a smartphone is fine. Editing skill is not judged.
(3) ${q.form}

■ 5. Judging
${q.criteria}
${q.c1}
${q.c2}
${q.c3}
${q.c4}
${q.c5}
First-round results (documents and video) will be e-mailed to all applicants around ${fmtEnLong(res1)}. Finalists will give a 5-minute presentation at the online final on ${fmtEnLong(fin)}.

■ 6. How to enter
${q.how}
${q.confirm}
${q.replace}

■ 7. Important notes
- ${q.anon}
- ${q.ai}
- ${q.copyright}
- Copyright in each entry remains with the applicant. However, the organizer may use the title, summary, and parts of the video for publicity.
- ${q.busy}
- Applicants bear any costs of entering (such as data charges).
- Personal information you provide will be used only to run this contest.

■ 8. Awards
Grand Prize (1): certificate and a book voucher worth ¥30,000
Excellence Award (2): certificate and a book voucher worth ¥10,000
Idea Award (a few): certificate
*Prizes are subject to change.

■ 9. Contact
Komichi Ideas Contest Secretariat (fictional)
E-mail: entry@komichi-contest.example
(Inquiries by e-mail only. We cannot reply on weekends or public holidays.)`;
}

/**
 * The decoded rules, in the same shape the live AI returns (see server/ai/schemas.mjs).
 * Handwritten: this is what a careful senior student would tell a first-timer.
 */
export function sampleDecoded(lang, deadline) {
  const q = quotes(lang, deadline);
  const m = sampleMeta(lang);
  const ja = lang === 'ja';
  return {
    contestName: m.name,
    organizer: m.organizer,
    theme: m.theme,
    deadline: {
      date: deadline,
      time: '23:59',
      summary: ja ? '日本時間23:59「必着」。1分でも遅れると受け付けてもらえません。' : '23:59 JST, and it must arrive by then. One minute late is not accepted.',
      quote: q.deadline,
    },
    eligibility: {
      summary: ja ? '高専・高校生なら応募できます。1人でもOK。' : 'Any kosen or high-school student in Japan can enter. Solo is fine.',
      points: ja
        ? ['個人、または3人までのチーム', 'チームなら指導教員を1人登録', '応募は1人（1チーム）1作品まで', '18歳未満は保護者の同意が必要']
        : ['Solo, or a team of up to 3', 'Teams register one supervising teacher', 'One entry per person (or team)', 'Under 18? You need a guardian’s consent'],
      quote: q.team,
    },
    deliverables: [
      {
        id: 'proposal',
        name: ja ? '企画書' : 'Proposal',
        format: 'PDF',
        limits: ja
          ? ['A4縦', '表紙込み10ページ以内', '10MB以下', '「課題の背景」「解決アイデア」「実現方法」「検証の計画」の4項目']
          : ['A4 portrait', '10 pages max, including the cover', '10 MB or less', 'Four sections: Background, Idea, How it will be built, Testing plan'],
        quote: q.proposal,
      },
      {
        id: 'video',
        name: ja ? '紹介動画' : 'Introduction video',
        format: 'MP4 → YouTube',
        limits: ja ? ['3分以内（5分から変更！）', 'YouTubeに「限定公開」', 'スマホ撮影でOK'] : ['3:00 or shorter (changed from 5!)', 'YouTube, set to "Unlisted"', 'Smartphone filming is fine'],
        quote: q.video,
      },
      {
        id: 'form',
        name: ja ? '応募フォーム' : 'Entry form',
        format: 'Web',
        limits: ja ? ['タイトル30文字以内', '概要200字以内', '応募者・指導教員の情報'] : ['Title: 30 characters max', 'Summary: 200 characters max', 'Your details and your teacher’s details'],
        quote: q.form,
      },
    ],
    criteria: [
      { id: 'problem', name: ja ? '課題設定の鋭さ' : 'Sharpness of the problem', weight: 25, description: ja ? '誰が・いつ・どう困っているか' : 'Who struggles, when, and how', quote: q.c1 },
      { id: 'originality', name: ja ? '独創性' : 'Originality', weight: 25, description: ja ? '既存の方法にない視点や工夫' : 'A perspective existing solutions miss', quote: q.c2 },
      { id: 'feasibility', name: ja ? '実現可能性' : 'Feasibility', weight: 25, description: ja ? '試作・検証の道筋' : 'A real path to build and test it', quote: q.c3 },
      { id: 'clarity', name: ja ? '伝わりやすさ' : 'Clarity', weight: 15, description: ja ? '初めて読む人に伝わるか' : 'A first-time reader gets it', quote: q.c4 },
      { id: 'reach', name: ja ? '広がり' : 'Reach', weight: 10, description: ja ? '他の人や地域にも役立つか' : 'Could it help others too?', quote: q.c5 },
    ],
    howToSubmit: {
      steps: ja
        ? ['公式サイトの応募フォームを開く', '企画書PDFをアップロード', '動画のURL（限定公開）を入力', '受付確認メールが届いたか確認（24時間以内）', '差し替えは締切前に1回だけ']
        : ['Open the entry form on the official website', 'Upload the proposal PDF', 'Paste the (unlisted) video URL', 'Check the confirmation e-mail arrives (within 24 h)', 'You can replace it once, before the deadline'],
      quote: q.how,
    },
    checklist: [
      { id: 'pdf', label: ja ? '企画書をA4縦のPDFで保存した' : 'Proposal saved as an A4 portrait PDF', quote: q.proposal },
      { id: 'pages', label: ja ? '表紙を含めて10ページ以内' : '10 pages or fewer, including the cover', quote: q.proposal },
      { id: 'size', label: ja ? 'PDFのファイルサイズが10MB以下' : 'PDF file size is 10 MB or less', quote: q.proposal },
      { id: 'video', label: ja ? '動画は3分以内・MP4' : 'Video is 3:00 or shorter, MP4', quote: q.video },
      { id: 'unlisted', label: ja ? 'YouTubeに「限定公開」でアップし、ログアウト状態で再生できた' : 'Uploaded to YouTube as Unlisted, and it plays when logged out', quote: q.video },
      { id: 'teacher', label: ja ? 'チームなら指導教員を登録した（個人ならチェック）' : 'Team entry: supervising teacher registered (solo: tick this)', quote: q.team },
      { id: 'consent', label: ja ? '18歳未満なら保護者の同意を得た' : 'Under 18: guardian’s consent obtained', quote: q.minor },
    ],
    gotchas: [
      { text: ja ? '動画は「3分以内」に変更。古い情報の「5分」で作らない。' : 'The video limit changed to 3 minutes. Don’t follow the old 5-minute rule.', quote: q.videoChange },
      { text: ja ? '企画書の本文に学校名・名前を書かない（表紙はOK）。' : 'No school name or personal names in the proposal body (the cover is OK).', quote: q.anon },
      { text: ja ? 'AIを使ったら、最終ページに「どこで・何に使ったか」を書く。' : 'If you used AI, say where and how on the last page.', quote: q.ai },
      { text: ja ? '締切直前はフォームが混む。前日までに出す。' : 'The form gets busy near the deadline. Submit a day early.', quote: q.busy },
    ],
  };
}

/** Quote lookup used by coach/review fixtures. */
export function sampleQuote(lang, deadline, key) {
  return quotes(lang, deadline)[key];
}

/** Rough check used by the demo provider to recognise the sample. */
export function isSampleText(text) {
  return typeof text === 'string' && (text.includes('こみちアイデアコンテスト') || text.includes('Komichi Ideas Contest'));
}
