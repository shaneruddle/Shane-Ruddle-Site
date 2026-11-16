import { useEffect, useMemo, useRef, useState } from 'react';
import { TrendingUp, Sparkles, Search, Globe, Trophy, Users, Loader2 } from 'lucide-react';
import { auth } from '../firebase';

// Shane's Dashboard card: daily visitors to shaneruddle.com since GA4 went live, plus a short list of good news
// worked out from the same numbers (GA4 + Search Console via /api/insights/site-pulse, Shane-only, cached an hour).
// Only positive lines are shown: a quiet week shows fewer wins, never bad news.

interface Pulse {
  days: { date: string; visitors: number; views: number }[];
  topPages: { title: string; views: number }[];
  countries: number;
  google: { date: string; impressions: number; clicks: number }[];
  pagesInGoogle: number;
  bestRanked: { page: string; position: number } | null;
}
type Win = { Icon: typeof Trophy; text: string };

const CACHE = 'sr_site_pulse';
const sum = (a: number[]) => a.reduce((s, n) => s + n, 0);
const fmt = (n: number) => n.toLocaleString('en-GB');
const dayLabel = (d: string, long = false) =>
  new Date(`${d}T12:00:00+07:00`).toLocaleDateString('en-GB', { weekday: long ? 'short' : undefined, day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' });

function wins(p: Pulse): Win[] {
  const out: Win[] = [];
  const days = p.days;
  const last7 = days.slice(-7), prev7 = days.slice(-14, -7);
  const week = sum(last7.map(d => d.visitors)), before = sum(prev7.map(d => d.visitors));
  const best = days.reduce((b, d) => (d.visitors > b.visitors ? d : b), days[0]);
  if (best && last7.includes(best) && best.visitors > 0) out.push({ Icon: Trophy, text: `Best day yet: ${fmt(best.visitors)} visitors on ${dayLabel(best.date, true)}` });
  if (before > 0 && week > before) out.push({ Icon: TrendingUp, text: `${fmt(week)} visitors this week, up ${Math.round((week / before - 1) * 100)}% on last week` });
  const g = p.google;
  const gWeek = sum(g.slice(-7).map(d => d.impressions)), gMonthAgo = sum(g.slice(-35, -28).map(d => d.impressions));
  if (gWeek > 0) out.push({ Icon: Search, text: gMonthAgo > 0 && gWeek >= gMonthAgo * 1.5
    ? `Google showed your pages ${fmt(gWeek)} times this week, up from ${fmt(gMonthAgo)} a month ago`
    : `Google showed your pages ${fmt(gWeek)} times this week` });
  if (p.pagesInGoogle >= 10) out.push({ Icon: Sparkles, text: `${fmt(p.pagesInGoogle)} of your pages turned up in Google searches this month` });
  if (p.bestRanked && p.bestRanked.position <= 10) {
    const words = decodeURIComponent(p.bestRanked.page.split('/').filter(Boolean).pop() || '').replace(/-/g, ' ');
    out.push({ Icon: Trophy, text: `On Google's first page: “${words}” sits at number ${Math.round(p.bestRanked.position)}` });
  }
  if (p.countries >= 5) out.push({ Icon: Globe, text: `Readers from ${p.countries} countries this week` });
  const total = sum(days.map(d => d.visitors));
  if (total > 0 && days[0]) out.push({ Icon: Users, text: `${fmt(total)} visits since ${dayLabel(days[0].date)}` });
  return out.slice(0, 5);
}

function Chart({ days }: { days: Pulse['days'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 640, H = 180, top = 12, bottom = 22;
  const max = Math.max(5, ...days.map(d => d.visitors));
  const x = (i: number) => (days.length < 2 ? 0 : (i / (days.length - 1)) * W);
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.visitors).toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${H - bottom} L0 ${H - bottom}Z`;
  const ticks = [0, Math.floor((days.length - 1) / 2), days.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const pick = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || days.length < 2) return;
    setHover(Math.max(0, Math.min(days.length - 1, Math.round(((clientX - r.left) / r.width) * (days.length - 1)))));
  };
  const h = hover !== null ? days[hover] : null;
  return (
    <div className="relative mt-5">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none select-none" preserveAspectRatio="none"
        role="img" aria-label={`Daily visitors, ${days.length} days, highest ${max}`}
        onPointerMove={e => pick(e.clientX)} onPointerDown={e => pick(e.clientX)} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="pulse-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#D4AF37" stopOpacity="0.32" />
            <stop offset="1" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.5, 1].map(f => <line key={f} x1="0" x2={W} y1={y(max * f)} y2={y(max * f)} stroke="#E5E1DA" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />)}
        <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} stroke="#E5E1DA" vectorEffect="non-scaling-stroke" />
        <path d={area} fill="url(#pulse-fill)" />
        <path d={line} fill="none" stroke="#B8860B" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {h && hover !== null && <line x1={x(hover)} x2={x(hover)} y1={top} y2={H - bottom} stroke="#0A0A0A" strokeOpacity="0.25" vectorEffect="non-scaling-stroke" />}
      </svg>
      {h && hover !== null && (
        <>
          <span className="pointer-events-none absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-gold-dark ring-2 ring-white"
            style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(h.visitors) / H) * 100}%` }} />
          <div className="pointer-events-none absolute -top-2 -translate-y-full bg-ink text-white rounded-lg px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow"
            style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 60px), calc(100% - 130px))` }}>
            <span className="text-white/60">{dayLabel(h.date, true)}</span> · <b className="font-semibold">{fmt(h.visitors)}</b> visitors
          </div>
        </>
      )}
      <div className="relative h-4 mt-1 text-[11px] text-black/40">
        {ticks.map(i => (
          <span key={i} className="absolute" style={i === 0 ? { left: 0 } : i === days.length - 1 ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' }}>
            {dayLabel(days[i].date)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SitePulse() {
  const [data, setData] = useState<Pulse | null>(() => {
    try { return JSON.parse(localStorage.getItem(CACHE) || 'null'); } catch { return null; }
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const r = await fetch('/api/insights/site-pulse', { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) throw new Error(String(r.status));
        const body = (await r.json()) as Pulse;
        if (!live) return;
        setData(body);
        localStorage.setItem(CACHE, JSON.stringify(body));
      } catch (err) {
        console.warn('Site numbers not loaded:', err);
        if (live) setFailed(true);
      }
    })();
    return () => { live = false; };
  }, []);

  const list = useMemo(() => (data?.days.length ? wins(data) : []), [data]);
  if (!data) {
    return (
      <section className="bg-white rounded-[20px] border border-cream-line p-6 mb-12 flex items-center gap-3 text-black/45 text-[14px]">
        {failed ? 'Site numbers are not available right now.' : <><Loader2 className="w-4 h-4 animate-spin" /> Loading your site numbers…</>}
      </section>
    );
  }
  const week = sum(data.days.slice(-7).map(d => d.visitors));
  const top = data.topPages[0];

  return (
    <section className="bg-white rounded-[20px] border border-cream-line shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-5 sm:p-7 mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 lg:gap-10">
        <div className="min-w-0">
          <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-gold-deep">shaneruddle.com</span>
          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            <span className="text-5xl md:text-6xl font-serif leading-none [font-variant-numeric:lining-nums]">{fmt(week)}</span>
            <span className="text-black/55 text-[15px]">visitors in the last 7 days</span>
          </div>
          <Chart days={data.days} />
          {top && <p className="mt-3 text-[13px] text-black/50 truncate">Most read this week: <span className="text-ink">{top.title}</span></p>}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-black/45 mb-2">Good news</div>
          <ul>
            {list.map(({ Icon, text }) => (
              <li key={text} className="flex gap-3 py-2.5 border-t border-cream-line first:border-t-0 text-[14.5px] leading-snug">
                <span className="w-8 h-8 rounded-full bg-gold/15 text-gold-deep inline-flex items-center justify-center flex-none"><Icon className="w-4 h-4" /></span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
