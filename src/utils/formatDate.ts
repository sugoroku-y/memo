function formatDate(format: string, date?: Date) {
  date ??= new Date();
  return format.replace(formatDate.PATTERN, f =>
    f.charAt(0) === '"'
      ? f.slice(1, -1).replace(/\\(.)/g, '$1')
      : formatDate.MAP[f as keyof typeof formatDate.MAP](date)
  );
}

formatDate.MAP = {
  YYYY: date => String(date.getFullYear()),
  YY: date => String(date.getFullYear() % 100).padStart(2, '0'),
  MMM: date =>
    [
      'Jun',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][date.getMonth()],
  MM: date => String(date.getMonth() + 1).padStart(2, '0'),
  M: date => String(date.getMonth() + 1),
  DD: date => String(date.getDate()).padStart(2, '0'),
  D: date => String(date.getDate()),
  hh: date => String(date.getHours()).padStart(2, '0'),
  h: date => String(date.getHours()),
  mm: date => String(date.getMinutes()).padStart(2, '0'),
  m: date => String(date.getMinutes()),
  ss: date => String(date.getSeconds()).padStart(2, '0'),
  s: date => String(date.getSeconds()),
  SSS: date => String(date.getMilliseconds()).padStart(3, '0'),
  ddd: date => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
  dd: date => ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
} as const satisfies Record<string, (date: Date) => string>;
formatDate.PATTERN = new RegExp(
  `${Object.keys(formatDate.MAP)
    .sort((a, b) => (a < b ? 1 : -1))
    .join('|')}${/|"([^"\\]*(?:\\.[^"\\]*)*)"/.source}`,
  'g'
);
