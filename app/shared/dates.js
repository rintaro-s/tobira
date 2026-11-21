// Date helpers. All plan/deadline math uses local calendar dates as "YYYY-MM-DD"
// strings so that day counts never drift with time zones or the time of day.

const pad = (n) => String(n).padStart(2, '0');

export function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // noon avoids DST edge cases
}

export function todayISO() {
  return toISODate(new Date());
}

export function addDays(iso, n) {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function diffDays(fromIso, toIso) {
  const a = fromISODate(fromIso);
  const b = fromISODate(toIso);
  return Math.round((b - a) / 86400000);
}

const JA_DOW = ['日', '月', '火', '水', '木', '金', '土'];
const EN_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EN_DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** 2026年12月19日（土） */
export function fmtJaLong(iso) {
  const d = fromISODate(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${JA_DOW[d.getDay()]}）`;
}
/** Saturday, December 19, 2026 */
export function fmtEnLong(iso) {
  const d = fromISODate(iso);
  return `${EN_DOW_LONG[d.getDay()]}, ${EN_MON_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
/** 12/19（土） or Sat, Dec 19 */
export function fmtShort(iso, lang) {
  const d = fromISODate(iso);
  if (lang === 'ja') return `${d.getMonth() + 1}/${d.getDate()}（${JA_DOW[d.getDay()]}）`;
  return `${EN_DOW[d.getDay()]}, ${EN_MON[d.getMonth()]} ${d.getDate()}`;
}
/** 12月19日 or Dec 19 */
export function fmtMonthDay(iso, lang) {
  const d = fromISODate(iso);
  if (lang === 'ja') return `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${EN_MON[d.getMonth()]} ${d.getDate()}`;
}
export function fmtLong(iso, lang) {
  return lang === 'ja' ? fmtJaLong(iso) : fmtEnLong(iso);
}
export function fmtYMD(iso) {
  const d = fromISODate(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}
