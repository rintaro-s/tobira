// Options for the three onboarding questions. Labels are bilingual.

export const SKILLS = [
  { id: 'design', ja: '絵・デザイン', en: 'Drawing & design' },
  { id: 'code', ja: 'プログラミング', en: 'Programming' },
  { id: 'make', ja: '工作・電子工作', en: 'Making & electronics' },
  { id: 'write', ja: '文章を書く', en: 'Writing' },
  { id: 'talk', ja: '話す・発表', en: 'Speaking' },
  { id: 'video', ja: '動画編集', en: 'Video editing' },
  { id: 'research', ja: '調べもの', en: 'Research' },
  { id: 'unsure', ja: 'まだ分からない', en: 'Not sure yet' },
];

export const MINUTES = [15, 30, 45, 60];

export const INTERESTS = [
  { id: 'school', ja: '学校生活', en: 'School life' },
  { id: 'town', ja: '地域・まち', en: 'My town' },
  { id: 'home', ja: '家族・家', en: 'Home & family' },
  { id: 'env', ja: '環境', en: 'Environment' },
  { id: 'care', ja: '福祉・やさしさ', en: 'Care & kindness' },
  { id: 'food', ja: '食', en: 'Food' },
  { id: 'nature', ja: '海・自然', en: 'Sea & nature' },
  { id: 'play', ja: 'ゲーム・遊び', en: 'Games & play' },
];

export function optionLabel(list, id, lang) {
  const o = list.find((x) => x.id === id);
  return o ? o[lang] : id;
}

/** Human-readable profile summary, used in prompts and in the plan header. */
export function describeProfile(profile, lang) {
  const skills = (profile.skills || []).map((s) => optionLabel(SKILLS, s, lang));
  if (profile.skillsOther) skills.push(profile.skillsOther);
  const interests = (profile.interests || []).map((s) => optionLabel(INTERESTS, s, lang));
  if (profile.interestsOther) interests.push(profile.interestsOther);
  return { skills, interests, minutes: profile.minutes || 30 };
}
