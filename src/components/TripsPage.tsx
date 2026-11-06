import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, CalendarDays, Car, Clock, MapPin, Moon } from "lucide-react";
import {
  LIKES,
  Like,
  MONTHS,
  NIGHTS,
  PRAC_URL,
  TRIPS,
  TRIPS_CHECKED,
  TRIPS_FAQS,
  TRIPS_META,
  Trip,
  WHO,
  Who,
  bestRange,
  matchTrips,
  tripCost,
} from "../lib/trips";
import { handleLinkClick } from "../lib/navigation";
import { trackEvent } from "../lib/analytics";
import { applyPageMeta } from "../seo";
import AskShane from "./AskShane";
import NewsletterSignup from "./NewsletterSignup";

// /trips-from-pattaya: Shane's seven road trips. A finder (who, what you like, nights, month)
// ranks them using his own verdicts, then a map and a card per trip with drive time, how long to
// stay, when to go, a rough cost and a PRAC link. Data: src/lib/trips.ts.

const baht = (n: number) => `฿${n.toLocaleString("en-GB")}`;

const Eyebrow = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <span className={`block text-[11px] font-medium uppercase tracking-[0.3em] mb-5 ${dark ? "text-gold" : "text-gold-deep"}`}>{children}</span>
);

const Badge = ({ fromShane, dark }: { fromShane: boolean; dark?: boolean }) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded-full whitespace-nowrap ${
      fromShane ? (dark ? "bg-gold/15 text-gold" : "bg-gold/15 text-gold-deep") : dark ? "bg-white/10 text-white/55" : "bg-black/[0.05] text-black/50"
    }`}
  >
    {fromShane && <BadgeCheck className="w-3 h-3" />}
    {fromShane ? "From my trip" : "Estimate"}
  </span>
);

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`px-4 h-10 rounded-full border text-sm transition-colors ${
        on ? "bg-gold border-gold text-ink font-medium" : "border-white/20 text-white/80 hover:border-gold hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function CostBox({ trip, people, nights, rentCar, dark }: { trip: Trip; people: number; nights: number; rentCar: boolean; dark?: boolean }) {
  const { lines, total } = tripCost(trip, people, nights, rentCar);
  return (
    <div className={`p-5 rounded-2xl ${dark ? "bg-white/[0.06]" : "bg-black/[0.03]"}`}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <span className={`text-[11px] uppercase tracking-[0.2em] font-semibold ${dark ? "text-white/60" : "text-black/55"}`}>
          Rough cost for {people} {people === 1 ? "person" : "people"}
        </span>
        <span className={`font-serif text-2xl ${dark ? "text-gold" : "text-gold-deep"}`}>{baht(total)}</span>
      </div>
      <ul className="space-y-1.5">
        {lines.map((l) => (
          <li key={l.label} className={`flex items-center justify-between gap-3 text-sm ${dark ? "text-white/70" : "text-black/65"}`}>
            <span className="flex flex-wrap items-center gap-2">
              {l.label} <Badge fromShane={l.fromShane} dark={dark} />
            </span>
            <span className="whitespace-nowrap">{baht(l.thb)}</span>
          </li>
        ))}
      </ul>
      <p className={`mt-3 text-xs ${dark ? "text-white/40" : "text-black/40"}`}>Hotels and food not included.</p>
    </div>
  );
}

function PracButton({ trip, slot }: { trip: Trip; slot: string }) {
  return (
    <a
      href={PRAC_URL}
      target="_blank"
      rel="noopener"
      onClick={() => trackEvent("select_promotion", { promotion_name: "prac", creative_slot: `${slot}_${trip.id}` })}
      className="inline-flex items-center gap-2 px-5 py-3 bg-gold text-ink text-xs font-semibold uppercase tracking-[0.16em] rounded-full hover:bg-ink hover:text-white transition-colors"
    >
      <Car className="w-4 h-4" /> Rent a car for this trip
    </a>
  );
}

// ---------------------------------------------------------------------------------------------
// The finder

function Finder() {
  const [who, setWho] = useState<Who | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [nights, setNights] = useState<number | null>(null);
  const [month, setMonth] = useState(0);
  const [rentCar, setRentCar] = useState(true);
  const started = useRef(false);
  const completed = useRef("");

  const touch = () => {
    if (!started.current) {
      started.current = true;
      trackEvent("trip_finder_start", {});
    }
  };

  const ready = who !== null && nights !== null;
  const matches = useMemo(() => (ready ? matchTrips({ who: who!, likes, nights: nights!, month }) : []), [ready, who, likes, nights, month]);
  const people = WHO.find((w) => w.id === who)?.people ?? 2;
  const picks = matches.filter((m) => m.fits).slice(0, 3);
  const rest = matches.filter((m) => !picks.includes(m));

  useEffect(() => {
    if (!ready || !picks[0]) return;
    const key = `${who}|${likes.join(",")}|${nights}|${month}`;
    if (completed.current === key) return;
    const t = setTimeout(() => {
      completed.current = key;
      trackEvent("trip_finder_complete", { top_trip: picks[0].trip.id, who, nights, month, likes: likes.join(",") });
    }, 1200);
    return () => clearTimeout(t);
  }, [ready, who, likes, nights, month, picks]);

  return (
    <div className="grid lg:grid-cols-12 gap-10 lg:gap-14">
      <div className="lg:col-span-5 space-y-7">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-3">Who's coming?</h2>
          <div className="flex flex-wrap gap-2">
            {WHO.map((w) => (
              <Chip key={w.id} on={who === w.id} onClick={() => { touch(); setWho(w.id); }}>{w.label}</Chip>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-3">What do you like? <span className="normal-case tracking-normal text-white/35">Pick any</span></h2>
          <div className="flex flex-wrap gap-2">
            {LIKES.map((l) => (
              <Chip
                key={l.id}
                on={likes.includes(l.id)}
                onClick={() => { touch(); setLikes((xs) => (xs.includes(l.id) ? xs.filter((x) => x !== l.id) : [...xs, l.id])); }}
              >
                {l.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-3">How long have you got?</h2>
          <div className="flex flex-wrap gap-2">
            {NIGHTS.map((n) => (
              <Chip key={n.value} on={nights === n.value} onClick={() => { touch(); setNights(n.value); }}>{n.label}</Chip>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-white/50 mb-3">When?</span>
            <select
              value={month}
              onChange={(e) => { touch(); setMonth(Number(e.target.value)); }}
              className="h-10 px-4 pr-10 rounded-full bg-white/[0.06] border border-white/20 text-white text-sm focus:outline-none focus:border-gold"
            >
              <option value={0} className="text-ink">Not sure yet</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1} className="text-ink">{m}</option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-2.5 h-10 text-sm text-white/75 cursor-pointer">
            <input type="checkbox" checked={rentCar} onChange={(e) => setRentCar(e.target.checked)} className="w-4 h-4 accent-[#D4AF37]" />
            I'll need a rental car
          </label>
        </div>
      </div>

      <div className="lg:col-span-7" aria-live="polite">
        {!ready ? (
          <div className="h-full min-h-[16rem] flex flex-col justify-center p-8 md:p-10 rounded-[1.5rem] border border-dashed border-white/15 text-white/55">
            <p className="font-serif text-2xl text-white mb-2">Tell me who's coming and how long you've got.</p>
            <p className="font-light leading-relaxed">I'll pick from the trips I've done myself, tell you why, and work out roughly what it costs.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {picks.length === 0 && (
              <p className="p-6 rounded-2xl bg-white/[0.06] text-white/75">
                None of my trips really fit that. With a day, I'd go to Bang Saray, and see the shorter ideas in{" "}
                <a href="/articles/best-day-trips-from-pattaya" onClick={handleLinkClick} className="text-gold underline">my day trips article</a>.
              </p>
            )}
            {picks.map((m, i) => (
              <article key={m.trip.id} className={`p-6 md:p-7 rounded-[1.5rem] ${i === 0 ? "bg-white text-ink" : "bg-white/[0.06] text-white"}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
                  <span className={`text-[11px] uppercase tracking-[0.22em] font-semibold ${i === 0 ? "text-gold-deep" : "text-gold"}`}>
                    {i === 0 ? "My pick for you" : `Also good, #${i + 1}`}
                  </span>
                  <span className={`text-xs ${i === 0 ? "text-black/45" : "text-white/45"}`}>{m.trip.drive}</span>
                </div>
                <h3 className="font-serif text-3xl leading-tight mb-1">{m.trip.name}</h3>
                <p className={`font-serif italic mb-4 ${i === 0 ? "text-black/60" : "text-white/60"}`}>"{m.trip.quote}"</p>
                <ul className="space-y-1.5 mb-5">
                  {m.reasons.map((r) => (
                    <li key={r.text} className={`flex gap-2 text-sm leading-relaxed ${i === 0 ? "text-black/70" : "text-white/70"}`}>
                      <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${r.good ? "bg-gold" : i === 0 ? "bg-black/25" : "bg-white/30"}`} />
                      {r.text}
                    </li>
                  ))}
                </ul>
                {i === 0 && (
                  <div className="mb-5">
                    <CostBox trip={m.trip} people={people} nights={nights!} rentCar={rentCar} />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-4">
                  {i === 0 && <PracButton trip={m.trip} slot="trip_finder" />}
                  <a
                    href={`#${m.trip.id}`}
                    onClick={() => trackEvent("select_content", { content_type: "trip_card", item_id: m.trip.id, source: "trip_finder" })}
                    className={`inline-flex items-center gap-1 text-xs font-medium ${i === 0 ? "text-gold-deep hover:text-ink" : "text-gold hover:text-white"}`}
                  >
                    See the trip <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`/articles/${m.trip.slug}`}
                    onClick={handleLinkClick}
                    className={`inline-flex items-center gap-1 text-xs font-medium ${i === 0 ? "text-black/55 hover:text-ink" : "text-white/55 hover:text-white"}`}
                  >
                    Read my article <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
            {rest.length > 0 && (
              <p className="text-sm text-white/45">
                Less of a fit:{" "}
                {rest.map((m, i) => (
                  <span key={m.trip.id}>
                    <a href={`#${m.trip.id}`} className="text-white/70 hover:text-gold underline decoration-white/20 underline-offset-2">{m.trip.name}</a>
                    {m.reasons.find((r) => !r.good) ? ` (${m.reasons.find((r) => !r.good)!.text.replace(/\.$/, "").toLowerCase()})` : ""}
                    {i < rest.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// The map: a stylised (roughly to scale) map of the eastern Gulf, with a line to each trip.

const LON0 = 99.25, LON1 = 102.75, LAT0 = 11.75, LAT1 = 17.3;
const W = 400, H = 620;
const px = (lon: number, lat: number): [number, number] => [((lon - LON0) / (LON1 - LON0)) * W, ((LAT1 - lat) / (LAT1 - LAT0)) * H];
const COAST: [number, number][] = [
  [99.7, 11.6], [99.8, 12.0], [99.95, 12.3], [99.97, 12.57], [100.0, 12.8], [100.05, 13.1], [100.0, 13.42],
  [100.3, 13.5], [100.6, 13.52], [100.85, 13.45], [100.93, 13.3], [100.9, 13.15], [100.87, 12.93], [100.9, 12.75],
  [100.93, 12.66], [101.15, 12.67], [101.28, 12.65], [101.45, 12.62], [101.7, 12.63], [102.0, 12.5], [102.2, 12.35],
  [102.4, 12.18], [102.55, 12.0], [102.6, 11.6],
];
const SEA = `M${COAST.map(([lon, lat]) => px(lon, lat).map((n) => n.toFixed(1)).join(",")).join(" L")} Z`;
const PATTAYA = px(100.87, 12.93);
const BANGKOK = px(100.5, 13.75);

function TripsMap({ active, onSelect }: { active: string | null; onSelect: (id: string) => void }) {
  const kanchanaburi = TRIPS.find((t) => t.id === "kanchanaburi")!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Map of my trips from Pattaya" className="w-full h-auto rounded-[1.25rem] bg-cream select-none">
      <title>Map of my trips from Pattaya</title>
      <path d={SEA} fill="#e3ebf0" />
      <ellipse cx={px(102.33, 12.05)[0]} cy={px(102.33, 12.05)[1]} rx="6" ry="13" fill="#F9F8F6" stroke="rgba(10,10,10,0.15)" />
      <text x="140" y="560" fontSize="11" letterSpacing="2" fill="rgba(10,10,10,0.3)">GULF OF THAILAND</text>

      <circle cx={BANGKOK[0]} cy={BANGKOK[1]} r="3" fill="rgba(10,10,10,0.35)" />
      <text x={BANGKOK[0] - 8} y={BANGKOK[1] - 8} fontSize="11" textAnchor="end" fill="rgba(10,10,10,0.45)">Bangkok</text>

      {TRIPS.map((t) => {
        const [x, y] = px(t.lon, t.lat);
        const from = t.id === "sukhothai" ? px(kanchanaburi.lon, kanchanaburi.lat) : PATTAYA;
        const on = active === t.id;
        return (
          <line key={`l-${t.id}`} x1={from[0]} y1={from[1]} x2={x} y2={y} stroke={on ? "#8A6D0B" : "rgba(138,109,11,0.35)"} strokeWidth={on ? 2.5 : 1.5} strokeDasharray="5 5" />
        );
      })}

      {TRIPS.map((t) => {
        const [x, y] = px(t.lon, t.lat);
        const on = active === t.id;
        const left = t.id === "koh-chang";
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-label={`${t.name}: ${t.drive}`}
            onClick={() => {
              onSelect(t.id);
              trackEvent("select_content", { content_type: "trip_card", item_id: t.id, source: "trip_map" });
            }}
            className="cursor-pointer"
          >
            <circle cx={x} cy={y} r="16" fill="transparent" />
            <circle cx={x} cy={y} r={on ? 8 : 6} fill={on ? "#D4AF37" : "#8A6D0B"} stroke="#fff" strokeWidth="2" />
            <text x={left ? x - 12 : x + 12} y={t.id === "rayong" ? y + 20 : y + 4} fontSize="13" fontWeight={on ? 700 : 500} textAnchor={left ? "end" : "start"} fill="#0A0A0A">
              {t.name}
            </text>
          </a>
        );
      })}

      <circle cx={PATTAYA[0]} cy={PATTAYA[1]} r="9" fill="#0A0A0A" stroke="#D4AF37" strokeWidth="2.5" />
      <text x={PATTAYA[0] - 14} y={PATTAYA[1] + 4} fontSize="13" fontWeight="700" textAnchor="end" fill="#0A0A0A">Pattaya</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// One card per trip

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-black/[0.03]">
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-black/45 mb-1">{icon}{label}</dt>
      <dd className="text-sm text-ink leading-snug">{children}</dd>
    </div>
  );
}

function TripCard({ trip, active }: { trip: Trip; active: boolean }) {
  return (
    <article id={trip.id} className={`scroll-mt-28 p-6 md:p-8 rounded-[1.5rem] bg-white border transition-colors ${active ? "border-gold" : "border-black/[0.07]"}`}>
      <span className="block text-[11px] uppercase tracking-[0.2em] text-black/40 mb-2">{trip.tagline}</span>
      <h3 className="font-serif text-3xl md:text-4xl leading-tight mb-3">{trip.name}</h3>
      <p className="font-serif italic text-lg text-black/65 mb-6 pl-4 border-l-2 border-gold">"{trip.quote}"</p>

      <dl className="grid sm:grid-cols-2 gap-3 mb-6">
        <Fact icon={<Clock className="w-3 h-3" />} label="Drive">
          {trip.drive}
          <span className="block text-xs text-black/45 mt-0.5">About {trip.km} km one way (estimate)</span>
        </Fact>
        <Fact icon={<Moon className="w-3 h-3" />} label="How long">{trip.stayLabel}</Fact>
        <Fact icon={<CalendarDays className="w-3 h-3" />} label="When">
          {trip.bestMonths.length ? <span className="font-medium">{bestRange(trip)}. </span> : null}
          {trip.whenLabel}
        </Fact>
        <Fact icon={<Car className="w-3 h-3" />} label="Getting there">{trip.howToGo}</Fact>
      </dl>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink mb-3">What I'd do</h4>
          <ul className="space-y-2">
            {trip.things.map((x) => (
              <li key={x} className="flex gap-2.5 text-sm text-black/70 leading-relaxed">
                <MapPin className="shrink-0 w-3.5 h-3.5 mt-1 text-gold-deep" />
                {x}
              </li>
            ))}
          </ul>
          {trip.whereToStay && (
            <>
              <h4 className="text-[11px] uppercase tracking-[0.2em] font-semibold text-ink mt-5 mb-2">Where I stay</h4>
              <p className="text-sm text-black/70 leading-relaxed">{trip.whereToStay}</p>
            </>
          )}
        </div>
        <div className="space-y-4">
          <CostBox trip={trip} people={2} nights={trip.stay[0]} rentCar />
          {trip.watchOut && (
            <p className="flex gap-2.5 p-4 rounded-xl bg-amber-500/10 text-sm text-ink/80 leading-relaxed">
              <AlertTriangle className="shrink-0 w-4 h-4 mt-0.5 text-amber-700" />
              {trip.watchOut}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-5 border-t border-black/[0.07]">
        <PracButton trip={trip} slot="trip_card" />
        <a href={`/articles/${trip.slug}`} onClick={handleLinkClick} className="inline-flex items-center gap-1 text-sm font-medium text-gold-deep hover:text-ink">
          Read my full {trip.name} article <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------------------------

export default function TripsPage() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    applyPageMeta(TRIPS_META);
  }, []);

  return (
    <>
      <section id="finder" className="bg-ink text-white pt-28 md:pt-36 pb-16 md:pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <Eyebrow dark>Visiting Pattaya · Trips from Pattaya</Eyebrow>
          <h1 className="font-serif font-normal text-[2.6rem] sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight mb-6 max-w-5xl">
            Where should we go? <span className="italic text-gold">My road trips from Pattaya.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/65 font-light leading-relaxed max-w-2xl mb-8">
            I've run a car rental company here since 2010, and these are the seven trips I've actually done, from a night in Bang
            Saen to Christmas on Koh Chang. Tell me who's coming and how long you've got, and I'll pick one.
          </p>
          <div className="flex items-center gap-3 mb-12 md:mb-16">
            <img src="/images/shane-portrait.webp" alt="" width={44} height={44} className="w-11 h-11 rounded-full object-cover" />
            <span className="text-sm text-white/60">
              By <a href="/about" onClick={handleLinkClick} className="text-white hover:text-gold">Shane Ruddle</a>
              <span className="block text-white/40">Owner of Pattaya Rent a Car · costs checked {TRIPS_CHECKED}</span>
            </span>
          </div>
          <Finder />
        </div>
      </section>

      <div className="bg-paper px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto space-y-16 md:space-y-24">
          <section>
            <Eyebrow>All seven trips</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl leading-tight mb-4 max-w-3xl">Drive times, how long to stay and what it costs</h2>
            <p className="text-black/60 font-light leading-relaxed max-w-2xl mb-10">
              Everything here comes from my own trips and articles. Distances, fuel, tolls and a few entry fees are my estimates, and
              they're marked. Costs are for two people in a rental car.
            </p>
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
              <div className="lg:col-span-4">
                <div className="lg:sticky lg:top-28 max-w-sm mx-auto lg:max-w-none">
                  <TripsMap active={active} onSelect={setActive} />
                  <p className="mt-3 text-xs text-black/45">Tap a place to jump to it. Lines show direction, not the road.</p>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-6">
                {TRIPS.map((t) => (
                  <TripCard key={t.id} trip={t} active={active === t.id} />
                ))}
              </div>
            </div>
          </section>

          <section className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-7">
              <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Trips from Pattaya: short answers</h2>
              <div className="divide-y divide-black/10 border-y border-black/10">
                {TRIPS_FAQS.map((f) => (
                  <div key={f.q} className="py-6">
                    <h3 className="font-serif text-xl leading-snug mb-2">{f.q}</h3>
                    <p className="text-black/65 font-light leading-relaxed">{f.a}</p>
                    {f.href && (
                      <a href={f.href} onClick={handleLinkClick} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-gold-deep hover:text-ink transition-colors">
                        More <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-black/55">
                Before you drive, read{" "}
                <a href="/articles/driving-in-pattaya" onClick={handleLinkClick} className="text-gold-deep underline">driving in Pattaya</a> and{" "}
                <a href="/articles/thai-driving-licence" onClick={handleLinkClick} className="text-gold-deep underline">getting a Thai driving licence</a>. For shorter
                outings, see <a href="/articles/best-day-trips-from-pattaya" onClick={handleLinkClick} className="text-gold-deep underline">the best day trips from Pattaya</a>.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="p-8 bg-cream border border-cream-line rounded-[2rem]">
                <Eyebrow>Planning a trip?</Eyebrow>
                <h2 className="font-serif text-3xl leading-tight mb-3">Ask me about a route</h2>
                <p className="text-black/60 font-light leading-relaxed mb-6">
                  Somewhere not on the list, a long drive with kids, or which car to take. Tell me what you're planning.
                </p>
                <AskShane source="trips_from_pattaya" initialTopic="visiting" showHeading={false} context="Trips from Pattaya page" />
              </div>
            </div>
          </section>

          <div className="p-8 md:p-12 bg-ink rounded-[2rem] grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-white mb-2">Get the next trip by email</h2>
              <p className="text-white/60 font-light">One short email a week on property, business and life in Pattaya. Free, no spam.</p>
            </div>
            <NewsletterSignup dark source="trips_from_pattaya" />
          </div>
        </div>
      </div>
    </>
  );
}
