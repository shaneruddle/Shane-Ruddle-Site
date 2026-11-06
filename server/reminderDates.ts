// Date maths for Shane's private Reminders, shared by the portal tab (src/components/RemindersAdmin.tsx)
// and the server (notifications). Pure functions only, no imports, so both sides can use it.
// All dates are Pattaya time (GMT+7, no daylight saving). Dates are 'YYYY-MM-DD', times 'HH:mm'.

export type RepeatFreq = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly';
export interface Repeat { freq: RepeatFreq; interval: number }

// Reminders with a date but no time notify at 9am, like iPhone Reminders.
export const DEFAULT_ALERT_TIME = '09:00';

export const bkkToday = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

export const bkkNowTime = (now = new Date()) =>
  now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false });

const parse = (iso: string) => new Date(`${iso}T12:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export const addDays = (iso: string, days: number) => {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fmt(d);
};

// Adds months, clamping to the last day of a short month (31 Jan + 1 month = 28/29 Feb).
export const addMonths = (iso: string, months: number, keepDay = parse(iso).getUTCDate()) => {
  const d = parse(iso);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(keepDay, last));
  return fmt(d);
};

export const weekday = (iso: string) => parse(iso).getUTCDay(); // 0 = Sunday

// The next due date after `from` for a repeating reminder.
export function nextDue(from: string, repeat: Repeat): string {
  const n = Math.max(1, Math.round(repeat.interval || 1));
  switch (repeat.freq) {
    case 'daily': return addDays(from, n);
    case 'weekdays': {
      let d = addDays(from, 1);
      while (weekday(d) === 0 || weekday(d) === 6) d = addDays(d, 1);
      return d;
    }
    case 'weekly': return addDays(from, 7 * n);
    case 'monthly': return addMonths(from, n);
    case 'yearly': return addMonths(from, 12 * n);
  }
}

// The moment a reminder should alert, as epoch ms (null if it has no date).
export const alertAt = (dueDate?: string | null, dueTime?: string | null) =>
  dueDate ? Date.parse(`${dueDate}T${dueTime || DEFAULT_ALERT_TIME}:00+07:00`) : null;

export const repeatLabel = (r?: Repeat | null) => {
  if (!r) return '';
  const n = Math.max(1, r.interval || 1);
  if (r.freq === 'weekdays') return 'Weekdays';
  if (n === 1) return { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }[r.freq];
  if (r.freq === 'weekly' && n === 2) return 'Fortnightly';
  return `Every ${n} ${{ daily: 'days', weekly: 'weeks', monthly: 'months', yearly: 'years' }[r.freq]}`;
};
