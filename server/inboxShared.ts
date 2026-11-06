// Shared rules for Shane's private Inbox (notes, ideas and tasks). Used by the app (src/components/InboxApp.tsx)
// and the server (server/inbox.ts), so dates, statuses and alerts are worked out the same way everywhere.
// Pure code only, no imports from outside server/, because the Docker image only ships server/.
import { alertAt, type Repeat } from './reminderDates';

export type Kind = 'task' | 'note' | 'idea';
// 'filed' is for notes, which don't need a task status. 'inbox' means not sorted yet.
export type Status = 'inbox' | 'next' | 'waiting' | 'someday' | 'filed' | 'done' | 'archived';
export type Actor = 'shane' | 'ai' | 'claude' | 'chatgpt' | 'import' | 'system';

export interface AiSuggestion {
  title: string;
  kind: Kind;
  area?: string | null;
  people?: string[];
  place?: string | null;
  placeWhen?: 'arrive' | 'leave' | null;
  dueDate?: string | null;
  dueTime?: string | null;
  remindDate?: string | null;
  remindTime?: string | null;
  waitingOn?: string | null;
  followUpDate?: string | null;
  notes?: string;
}

export interface Item {
  id: string;
  title: string;
  body?: string;
  raw?: string;             // the original capture, exactly as typed or dictated
  captureId?: string;       // items split from one capture share this
  kind: Kind;
  status: Status;
  area?: string | null;     // inbox_areas id
  people?: string[];
  place?: string | null;
  placeWhen?: 'arrive' | 'leave' | null;
  dueDate?: string | null;  // when it's due
  dueTime?: string | null;
  remindDate?: string | null; // when to remind (separate from due)
  remindTime?: string | null;
  alertAt?: number | null;  // epoch ms for notifications, derived from the two above
  repeat?: Repeat | null;
  waitingOn?: string | null;
  waitingSince?: string | null;
  followUpDate?: string | null;
  flagged?: boolean;
  links?: string[];
  ai?: { state: 'pending' | 'done' | 'failed' | 'off'; error?: string; split?: AiSuggestion[]; applied?: string[]; at?: number };
  version?: number;
  createdBy?: Actor;
  updatedBy?: Actor;
  createdAt?: { toMillis(): number } | null;
  updatedAt?: { toMillis(): number } | null;
  completedAt?: { toMillis(): number } | null;
  appleId?: string;
}

export const STATUS_LABEL: Record<Status, string> = {
  inbox: 'Inbox', next: 'Next action', waiting: 'Waiting on', someday: 'Someday', filed: 'Filed', done: 'Done', archived: 'Archived',
};

// The reminder time wins; otherwise alert on the due date (at its time, or 9am).
export const computeAlertAt = (i: Pick<Item, 'remindDate' | 'remindTime' | 'dueDate' | 'dueTime'>) =>
  i.remindDate ? alertAt(i.remindDate, i.remindTime) : alertAt(i.dueDate, i.dueTime);

// Default status for a kind once sorted. Never 'done'.
export const statusFor = (kind: Kind, waitingOn?: string | null): Status =>
  kind === 'note' ? 'filed' : kind === 'idea' ? 'someday' : waitingOn ? 'waiting' : 'next';

// Guard against invented deadlines: only keep a date if the words actually mention one.
const DATE_CUE = /\b(today|tonight|tomorrow|tmrw|yesterday|mon(day)?|tue(s(day)?)?|wed(nesday)?|thu(rs(day)?)?|fri(day)?|sat(urday)?|sun(day)?|weekend|week|month|year|morning|afternoon|evening|noon|midnight|jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may \d{1,2}|\d{1,2} may|jun(e)?|jul(y)?|aug(ust)?|sep(t(ember)?)?|oct(ober)?|nov(ember)?|dec(ember)?|\d{1,2}(:\d{2})?\s?(am|pm)|\d{1,2}(st|nd|rd|th)|\d{1,2}[/.-]\d{1,2}|in \d+ (days?|weeks?|hours?)|by (the )?end|deadline|due|asap)\b/i;
export const mentionsDate = (text: string) => DATE_CUE.test(text);

const isDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

// Cleans one AI suggestion: drops unknown areas, bad dates and any date the text never mentioned.
export function cleanSuggestion(s: Record<string, unknown>, raw: string, areaIds: string[]): AiSuggestion | null {
  const title = str(s.title, 200);
  if (!title) return null;
  const kind: Kind = s.kind === 'note' || s.kind === 'idea' ? s.kind : 'task';
  const dated = mentionsDate(raw);
  const pick = (v: unknown) => (dated && isDate(v) ? v : null);
  const dueDate = pick(s.dueDate);
  const remindDate = pick(s.remindDate);
  return {
    title,
    kind,
    area: typeof s.area === 'string' && areaIds.includes(s.area) ? s.area : null,
    people: Array.isArray(s.people) ? s.people.map(p => str(p, 60)).filter(Boolean).slice(0, 6) : [],
    place: str(s.place, 80) || null,
    placeWhen: s.placeWhen === 'leave' ? 'leave' : str(s.place, 80) ? 'arrive' : null,
    dueDate,
    dueTime: dueDate && isTime(s.dueTime) ? s.dueTime : null,
    remindDate,
    remindTime: remindDate && isTime(s.remindTime) ? s.remindTime : null,
    waitingOn: str(s.waitingOn, 60) || null,
    followUpDate: pick(s.followUpDate),
    notes: str(s.notes, 1000),
  };
}

// Lower-case text used for search.
export const searchText = (i: Partial<Item>, areaName = '') =>
  [i.title, i.body, i.raw, areaName, i.place, i.waitingOn, ...(i.people || [])].filter(Boolean).join(' ').toLowerCase();

export const DEFAULT_AREAS: { name: string; color: string; aliases: string }[] = [
  { name: 'Alan Bolton Property', color: '#1E3A8A', aliases: 'ABPC, Alan Bolton, pattaya-property.net' },
  { name: 'East Coast Real Estate', color: '#0891B2', aliases: 'ECRE, East Coast, thaiproperty.com' },
  { name: 'Pattaya Rent a Car', color: '#16A34A', aliases: 'PRAC, rent a car, car rental, manager Gift' },
  { name: 'Hemingways Jomtien', color: '#B8860B', aliases: 'Jomtien' },
  { name: 'Hemingways Pattaya', color: '#92400E', aliases: 'Hemingways Pattaya, Pattaya bar' },
  { name: 'Hemingways Lakeside', color: '#0F766E', aliases: 'Lakeside' },
  { name: 'Cajun Life Café', color: '#DC2626', aliases: 'Cajun' },
  { name: 'Personal', color: '#57534E', aliases: 'me, health, admin, visa' },
  { name: 'Family', color: '#DB2777', aliases: 'family, kids, home' },
];
