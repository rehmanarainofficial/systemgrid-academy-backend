const PAKISTAN_TIMEZONE = 'Asia/Karachi';

export function getPakistanDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PAKISTAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getServerTimePayload(date = new Date()) {
  return {
    now: date.toISOString(),
    timezone: PAKISTAN_TIMEZONE,
    date: getPakistanDateString(date),
  };
}

export function parsePakistanClassDateTime(date: string, time: string) {
  const normalizedTime = time.slice(0, 5);
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = normalizedTime.split(':').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour - 5, minute));
  return utc;
}
