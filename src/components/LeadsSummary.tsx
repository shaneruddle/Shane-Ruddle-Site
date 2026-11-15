import { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit, Timestamp } from 'firebase/firestore';

// Leads by page for the last four weeks, at the top of the Enquiries tab: Ask Shane questions and CVs
// (passed in) plus "email me my result" leads from the tools (Firestore `leads`, Shane-only read).
// Shows which pages actually produce enquiries.

interface Item { page?: string | null; kind: 'question' | 'cv'; createdAt?: Timestamp }
interface ToolResult { tool?: string; at?: Timestamp | Date }

const DAY = 86_400_000;
const WEEKS = 4;
const millis = (t?: Timestamp | Date) => (t ? (t instanceof Date ? t.getTime() : t.toMillis()) : 0);
const tidy = (p: string) => (p.length > 46 ? `${p.slice(0, 45)}…` : p);

export default function LeadsSummary({ items }: { items: Item[] }) {
  const [tools, setTools] = useState<ToolResult[] | null>(null);

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'leads'), orderBy('createdAt', 'desc'), limit(300)),
        snap => setTools(snap.docs.flatMap(d => (d.data().results || []) as ToolResult[])),
        err => { console.error('Error loading leads:', err.message); setTools([]); },
      ),
    [],
  );

  const stats = useMemo(() => {
    const now = Date.now();
    const since = now - WEEKS * 7 * DAY;
    const rows: { key: string; type: string; at: number }[] = [];
    for (const e of items) {
      const at = millis(e.createdAt);
      if (at >= since) rows.push({ key: e.page || (e.kind === 'cv' ? '/work-in-pattaya' : '(page not recorded)'), type: e.kind === 'cv' ? 'CV' : 'Question', at });
    }
    for (const r of tools || []) {
      const at = millis(r.at);
      if (at >= since) rows.push({ key: `Tool: ${r.tool || 'unknown'}`, type: 'Email my result', at });
    }
    const weeks = Array.from({ length: WEEKS }, (_, i) => rows.filter(r => r.at >= now - (i + 1) * 7 * DAY && r.at < now - i * 7 * DAY).length);
    const byPage = new Map<string, { total: number; types: Set<string> }>();
    for (const r of rows) {
      const cur = byPage.get(r.key) || { total: 0, types: new Set<string>() };
      cur.total++;
      cur.types.add(r.type);
      byPage.set(r.key, cur);
    }
    return { total: rows.length, weeks, pages: [...byPage.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8) };
  }, [items, tools]);

  return (
    <section className="mb-8 p-5 md:p-6 bg-white border border-black/10 rounded-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="font-serif text-xl text-ink">Leads by page, last 4 weeks</h2>
        <span className="text-xs text-black/45">
          This week {stats.weeks[0]} · last week {stats.weeks[1]} · 4 weeks {stats.total}
        </span>
      </div>
      {tools === null ? (
        <p className="text-sm text-black/40">Loading…</p>
      ) : stats.pages.length === 0 ? (
        <p className="text-sm text-black/45">No questions, CVs or tool results in the last 4 weeks.</p>
      ) : (
        <ul className="divide-y divide-black/5 text-sm">
          {stats.pages.map(([page, s]) => (
            <li key={page} className="flex items-center gap-3 py-2">
              <span className="font-semibold text-ink w-6 text-right">{s.total}</span>
              <span className="min-w-0 flex-1 truncate text-ink/80" title={page}>{tidy(page)}</span>
              <span className="text-xs text-black/40 shrink-0">{[...s.types].join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
