import { useEffect, useMemo, useState } from 'react';
import { db, UserProfile } from '../firebase';
import { collection, getDocs, limit, orderBy, query, Timestamp } from 'firebase/firestore';
import { Loader2, Activity, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userCompany?: string;
  type?: string;
  details?: string;
  discountName?: string;
  timestamp?: Timestamp;
}

type StaffRow = UserProfile & { id: string; lastLoginAt?: Timestamp };

const LOG_LIMIT = 500;

const TYPE_LABELS: Record<string, string> = {
  login: 'Logged in',
  signup: 'Signed up',
  auth_error: 'Login blocked',
  profile_update: 'Updated profile',
  redemption: 'Used a discount',
  employee_update: 'Staff record changed',
};

const typeLabel = (t?: string) => (t && TYPE_LABELS[t]) || t || 'Other';

const TYPE_STYLES: Record<string, string> = {
  login: 'bg-emerald-50 text-emerald-700',
  signup: 'bg-sky-50 text-sky-700',
  auth_error: 'bg-red-50 text-red-700',
  redemption: 'bg-amber-50 text-amber-800',
};

const formatDateTime = (t?: Timestamp) =>
  t ? t.toDate().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '';

const timeAgo = (t?: Timestamp) => {
  if (!t) return 'Never';
  const mins = Math.floor((Date.now() - t.toMillis()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDateTime(t).split(',')[0];
};

const displayName = (u: Partial<StaffRow>) =>
  u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.mobile || 'Unknown';

// Admin-only view of staff logins and actions recorded in usage_logs.
export default function ActivityAdmin() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'staff' | 'feed'>('staff');
  const [search, setSearch] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState('');
  const [person, setPerson] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [usersSnap, logsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'usage_logs'), orderBy('timestamp', 'desc'), limit(LOG_LIMIT))),
      ]);
      setStaff(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as StaffRow)));
      setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry)));
    } catch (err) {
      console.error('Error loading activity:', err instanceof Error ? err.message : err);
      toast.error('Could not load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Last login per user: the profile's lastLoginAt, or the newest login log if that's missing.
  const lastLoginFromLogs = useMemo(() => {
    const map = new Map<string, Timestamp>();
    for (const l of logs) {
      if (l.type === 'login' && l.userId && l.timestamp && !map.has(l.userId)) map.set(l.userId, l.timestamp);
    }
    return map;
  }, [logs]);

  const actionCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) if (l.userId) map.set(l.userId, (map.get(l.userId) || 0) + 1);
    return map;
  }, [logs]);

  const companies = useMemo(
    () => Array.from(new Set([...staff.map(s => s.company), ...logs.map(l => l.userCompany)].filter((c): c is string => !!c && c !== 'Unknown'))).sort(),
    [staff, logs]
  );
  const types = useMemo(() => Array.from(new Set(logs.map(l => l.type).filter((t): t is string => !!t))).sort(), [logs]);

  const q = search.trim().toLowerCase();

  const staffRows = useMemo(() => {
    return staff
      .map(s => {
        const uid = s.uid || s.id;
        return { ...s, uid, last: s.lastLoginAt || lastLoginFromLogs.get(uid), actions: actionCounts.get(uid) || 0 };
      })
      .filter(s => !company || s.company === company)
      .filter(s => !q || [displayName(s), s.email, s.mobile, s.company].some(v => v?.toLowerCase().includes(q)))
      .sort((a, b) => (b.last?.toMillis() || 0) - (a.last?.toMillis() || 0));
  }, [staff, lastLoginFromLogs, actionCounts, company, q]);

  const feedRows = useMemo(() => {
    return logs
      .filter(l => !company || l.userCompany === company)
      .filter(l => !type || l.type === type)
      .filter(l => !person || l.userId === person)
      .filter(l => !q || [l.userName, l.userEmail, l.userCompany, l.details, l.discountName].some(v => v?.toLowerCase().includes(q)));
  }, [logs, company, type, person, q]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeThisWeek = staffRows.filter(s => s.last && s.last.toMillis() > weekAgo).length;
  const neverLoggedIn = staffRows.filter(s => !s.last).length;

  const showPerson = (uid: string) => {
    setPerson(uid);
    setType('');
    setView('feed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gold-deep" />
      </div>
    );
  }

  const personStaff = staff.find(s => (s.uid || s.id) === person);
  const personName = personStaff ? displayName(personStaff) : logs.find(l => l.userId === person)?.userName || 'Unknown';
  const selectClass = 'px-3 py-2 rounded-full bg-black/5 text-sm text-ink border-0 focus:ring-2 focus:ring-gold-deep/30';

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        {[
          ['Staff accounts', staffRows.length],
          ['Logged in this week', activeThisWeek],
          ['Never logged in', neverLoggedIn],
        ].map(([label, value]) => (
          <div key={label} className="p-4 sm:p-5 bg-white border border-black/10 rounded-2xl">
            <div className="text-2xl sm:text-3xl font-serif text-ink">{value}</div>
            <div className="text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] font-semibold text-black/40 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['staff', 'feed'] as const).map(key => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${view === key ? 'bg-ink text-white' : 'bg-black/5 text-black/50 hover:text-ink'}`}
          >
            {key === 'staff' ? 'Staff' : 'Activity feed'}
          </button>
        ))}
        <button onClick={load} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-xs text-black/50 hover:text-ink" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-black/30 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, mobile"
            className="w-full pl-9 pr-3 py-2 rounded-full bg-black/5 text-sm border-0 focus:ring-2 focus:ring-gold-deep/30"
          />
        </div>
        <select value={company} onChange={e => setCompany(e.target.value)} className={selectClass}>
          <option value="">All companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {view === 'feed' && (
          <select value={type} onChange={e => setType(e.target.value)} className={selectClass}>
            <option value="">All actions</option>
            {types.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
          </select>
        )}
      </div>

      {view === 'staff' ? (
        staffRows.length === 0 ? (
          <Empty text="No staff match." />
        ) : (
          <div className="bg-white border border-black/10 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-[0.2em] text-black/40 border-b border-black/10">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Last login</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffRows.map(s => (
                  <tr key={s.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                    <td className="px-5 py-3">
                      <div className="font-medium text-ink">{displayName(s)}</div>
                      <div className="text-xs text-black/40">{s.email || s.mobile}</div>
                    </td>
                    <td className="px-5 py-3 text-black/60">{s.company || '—'}</td>
                    <td className="px-5 py-3" title={formatDateTime(s.last)}>
                      <span className={s.last ? 'text-ink' : 'text-black/30'}>{timeAgo(s.last)}</span>
                    </td>
                    <td className="px-5 py-3">
                      {s.active === false
                        ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700">Not activated</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700">Active</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {s.actions > 0 ? (
                        <button onClick={() => showPerson(s.uid)} className="text-gold-deep hover:underline text-xs font-semibold">
                          View {s.actions}
                        </button>
                      ) : <span className="text-black/30 text-xs">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <>
          {person && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <span className="text-black/50">Showing</span>
              <span className="font-semibold text-ink">{personName}</span>
              <button onClick={() => setPerson('')} className="text-xs text-gold-deep hover:underline">Show everyone</button>
            </div>
          )}
          {feedRows.length === 0 ? (
            <Empty text="No activity matches." />
          ) : (
            <ul className="bg-white border border-black/10 rounded-2xl divide-y divide-black/5">
              {feedRows.map(l => (
                <li key={l.id} className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-xs text-black/40 w-36 shrink-0">{formatDateTime(l.timestamp)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${TYPE_STYLES[l.type || ''] || 'bg-black/5 text-black/60'}`}>{typeLabel(l.type)}</span>
                  <button onClick={() => l.userId && setPerson(l.userId)} className="font-medium text-ink hover:text-gold-deep">
                    {l.userName || l.userEmail || 'Unknown'}
                  </button>
                  {l.userCompany && l.userCompany !== 'Unknown' && <span className="text-xs text-black/40">{l.userCompany}</span>}
                  {(l.discountName || l.details) && (
                    <span className="basis-full sm:basis-auto text-xs text-black/50 sm:ml-auto">{l.discountName || l.details}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {logs.length >= LOG_LIMIT && (
            <p className="text-xs text-black/40 mt-4">Showing the latest {LOG_LIMIT} entries.</p>
          )}
        </>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="p-12 text-center rounded-3xl border-2 border-dashed border-black/5">
      <Activity className="w-12 h-12 text-black/10 mx-auto mb-4" />
      <p className="text-sm text-black/40 uppercase tracking-[0.12em] font-bold">{text}</p>
    </div>
  );
}
