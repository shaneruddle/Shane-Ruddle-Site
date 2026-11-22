import { ReactNode, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Car, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";
import { trackEvent } from "../lib/analytics";
import { handleLinkClick } from "../lib/navigation";
import { CURRENCIES, Currency } from "../lib/costOfLiving";

// Three small reader tools for retirees, movers and nomads:
// - DrivingLicenceCheck: which licence do I need to drive here? (IDP articles, links to PRAC)
// - RetirementMoneyCheck: which money route fits the retirement visa? (retirement visa page)
// - AdminCalendar: when are my 90-day report and extension due? (TM30/90-day article, visa pages)
// Figures match src/lib/visas.ts (RULES_AS_OF). Rules change: keep them in step.

const PRAC_URL = "https://pattayarentacar.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=licence_checker";
const baht = (n: number) => `฿${Math.round(n).toLocaleString("en-GB")}`;

/** Articles that show the driving licence checker. */
export const LICENCE_CHECK_ARTICLES = new Set([
  "international-driving-permit-thailand",
  "thai-driving-licence",
  "driving-in-pattaya",
  "renting-a-car-in-pattaya",
  "scooter-or-car-in-pattaya",
]);

/** Articles that show the 90-day report and extension calendar. */
export const ADMIN_CALENDAR_ARTICLES = new Set(["tm30-and-90-day-report-pattaya", "first-month-in-pattaya", "retiring-in-pattaya"]);

function Shell({ icon, eyebrow, title, intro, children }: { icon: ReactNode; eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section className="p-7 md:p-9 bg-white border border-black/[0.08] rounded-[1.5rem] not-prose">
      <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.24em] text-gold-deep mb-3">
        {icon}
        {eyebrow}
      </span>
      <h2 className="font-serif text-2xl md:text-3xl leading-snug text-ink mb-2">{title}</h2>
      <p className="text-black/60 mb-6">{intro}</p>
      {children}
    </section>
  );
}

function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T | ""; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="mb-5">
      <legend className="text-sm font-medium text-ink mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={value === o.id}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${value === o.id ? "bg-ink text-white border-ink" : "bg-white text-black/70 border-black/15 hover:border-black/40"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Result({ good, children }: { good: boolean; children: ReactNode }) {
  return (
    <div className={`mt-2 p-5 md:p-6 rounded-2xl border ${good ? "bg-gold/10 border-gold/40" : "bg-black/[0.03] border-black/10"}`} aria-live="polite">
      <div className="flex gap-3">
        {good ? <CheckCircle2 className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-black/50 shrink-0 mt-0.5" />}
        <div className="space-y-3 text-black/75 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// ---------------- Driving licence checker ----------------

type Stay = "holiday" | "living";
type Vehicle = "car" | "bike";
type Home = "uk" | "us" | "au" | "eu" | "other";

const IDP_WHERE: Record<Home, string> = {
  uk: "In the UK you get one over the counter at participating PayPoint shops. Ask for the 1949 permit, which is the one Thailand uses for UK drivers.",
  us: "In the USA they're issued by AAA. It takes a passport photo and a short form.",
  au: "In Australia you get one from your state motoring club.",
  eu: "In most of Europe your national motoring club or licensing office issues them.",
  other: "Your national motoring club or licensing office usually issues them. Thailand recognises permits under both the 1949 and 1968 conventions.",
};

export function DrivingLicenceCheck({ source }: { source: string }) {
  const [stay, setStay] = useState<Stay | "">("");
  const [vehicle, setVehicle] = useState<Vehicle | "">("");
  const [home, setHome] = useState<Home | "">("");
  const [bikeCat, setBikeCat] = useState<"yes" | "no" | "">("");
  const ready = !!(stay && vehicle && home && (vehicle === "car" || bikeCat));

  useEffect(() => {
    if (ready) trackEvent("licence_check_complete", { source, stay, vehicle, home, bike_category: bikeCat || "n/a" });
  }, [ready, source, stay, vehicle, home, bikeCat]);

  return (
    <Shell icon={<Car className="w-4 h-4" />} eyebrow="Licence checker" title="Which licence do I need to drive in Thailand?" intro="Four quick questions. The answer is what I tell customers at Pattaya Rent a Car every week.">
      <Choice<Stay> label="Are you here on holiday or living here?" value={stay} onChange={setStay} options={[{ id: "holiday", label: "Holiday or a few months" }, { id: "living", label: "Living here" }]} />
      <Choice<Vehicle> label="What will you drive?" value={vehicle} onChange={setVehicle} options={[{ id: "car", label: "A car" }, { id: "bike", label: "A scooter or motorbike" }]} />
      <Choice<Home> label="Where is your licence from?" value={home} onChange={setHome} options={[{ id: "uk", label: "UK" }, { id: "us", label: "USA" }, { id: "au", label: "Australia" }, { id: "eu", label: "Europe" }, { id: "other", label: "Somewhere else" }]} />
      {vehicle === "bike" && (
        <Choice<"yes" | "no"> label="Does your licence from home cover motorbikes?" value={bikeCat} onChange={setBikeCat} options={[{ id: "yes", label: "Yes, it has the motorbike category" }, { id: "no", label: "No, car only" }]} />
      )}

      {ready && (
        <div>
          {stay === "living" ? (
            <Result good>
              <p><strong>Get a Thai driving licence.</strong> If you live here and you're here to stay, that's the rule I go by. With your licence from home there's no driving test: you watch a video and do a few quick physical tests.</p>
              <p>Until it's done, carry your licence from home plus an International Driving Permit, so a checkpoint is a two-minute stop and not a ฿500 fine.</p>
              <p><a href="/articles/thai-driving-licence" onClick={handleLinkClick} className="text-gold-deep underline">How to get a Thai licence in Pattaya</a></p>
            </Result>
          ) : vehicle === "bike" && bikeCat === "no" ? (
            <Result good={false}>
              <p><strong>Don't ride a motorbike on this licence.</strong> An International Driving Permit only covers what your licence from home covers. With a car-only licence you're riding unlicensed, and travel insurance is very unlikely to pay out if you crash.</p>
              <p>Rent a car instead, or use Grab and baht buses until you have the right licence.</p>
            </Result>
          ) : (
            <Result good>
              <p><strong>Bring your licence from home and an International Driving Permit, and carry your passport.</strong> Rental companies, including mine, will rent to you on your licence from home, but at a police checkpoint you'll often be fined ฿500 without an IDP or a Thai licence, and you pay it at the police station.</p>
              <p>{IDP_WHERE[home as Home]} Get it before you fly: you can't get one once you're here.</p>
              {vehicle === "bike" && <p>Wear a helmet every time. It's the law, and most of the accidents I hear about involve bikes.</p>}
            </Result>
          )}
          <a
            href={PRAC_URL}
            target="_blank"
            rel="noopener"
            onClick={() => trackEvent("select_promotion", { promotion_id: "prac", creative_slot: `licence_check_${source}` })}
            className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors"
          >
            Rent a car in Pattaya <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </Shell>
  );
}

// ---------------- Retirement visa money checker ----------------

const DEPOSIT = 800000;
const MONTHLY = 65000;

export function RetirementMoneyCheck() {
  const [cur, setCur] = useState<Currency>("GBP");
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const rate = CURRENCIES.find((c) => c.id === cur)!;
  const num = (s: string) => Math.max(0, Number(s.replace(/[^0-9.]/g, "")) || 0);

  const r = useMemo(() => {
    if (!age || (!income && !savings)) return null;
    const a = num(age);
    const monthTHB = num(income) * rate.perUnit;
    const saveTHB = num(savings) * rate.perUnit;
    const combo = monthTHB * 12 + saveTHB;
    return { a, monthTHB, saveTHB, combo };
  }, [age, income, savings, rate]);

  return (
    <Shell icon={<Wallet className="w-4 h-4" />} eyebrow="Money checker" title="Do I have enough for a retirement visa?" intro="Put in your monthly pension or income and the savings you could move to a Thai bank. Figures as of November 2026, converted at rough rates.">
      <div className="mb-5">
        <span className="block text-sm font-medium text-ink mb-2">Your currency</span>
        <div className="flex flex-wrap gap-2">
          {CURRENCIES.filter((c) => c.id !== "RUB").map((c) => (
            <button key={c.id} type="button" aria-pressed={cur === c.id} onClick={() => setCur(c.id)} className={`px-4 py-2 rounded-full text-sm border ${cur === c.id ? "bg-ink text-white border-ink" : "bg-white text-black/70 border-black/15"}`}>
              {c.symbol} {c.id}
            </button>
          ))}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          ["Your age", age, setAge, "e.g. 58"],
          [`Monthly pension or income (${rate.symbol})`, income, setIncome, "after tax"],
          [`Savings you could move to Thailand (${rate.symbol})`, savings, setSavings, "0 if none"],
        ].map(([label, v, set, ph]) => (
          <label key={label as string} className="block">
            <span className="block text-sm font-medium text-ink mb-2">{label as string}</span>
            <input
              inputMode="decimal"
              value={v as string}
              placeholder={ph as string}
              onChange={(e) => (set as (s: string) => void)(e.target.value)}
              onBlur={() => r && trackEvent("retirement_money_check", { currency: cur })}
              className="w-full px-4 py-3 rounded-xl border border-black/15 bg-paper focus:outline-none focus:border-gold-deep"
            />
          </label>
        ))}
      </div>

      {r && (r.a > 0 && r.a < 50 ? (
        <Result good={false}>
          <p><strong>You need to be 50 or over for a retirement visa.</strong> Under 50, people living here usually use the DTV if they work online, Thailand Privilege if they'd rather pay once, or an education visa.</p>
          <p><a href="/thai-visas" onClick={handleLinkClick} className="text-gold-deep underline">Find the visa that fits you</a></p>
        </Result>
      ) : r.monthTHB >= MONTHLY ? (
        <Result good>
          <p><strong>Your income alone qualifies.</strong> About {baht(r.monthTHB)} a month against the ฿65,000 needed. You'll need proof of it each year: an embassy income letter or Thai bank statements showing the money arriving, depending on your nationality and the immigration office.</p>
          {r.saveTHB >= DEPOSIT && <p>Your savings would also cover the ฿800,000 deposit route, which many people find simpler to prove.</p>}
        </Result>
      ) : r.saveTHB >= DEPOSIT ? (
        <Result good>
          <p><strong>The deposit route works for you.</strong> Put ฿800,000 in a Thai bank account. It usually has to be there 2 months before you apply and 3 months after, and never drop below ฿400,000 for the rest of the year.</p>
          <p>That's about {rate.symbol}{Math.round(DEPOSIT / rate.perUnit).toLocaleString("en-GB")} at today's rough rate. Leave a margin, because exchange rates move.</p>
        </Result>
      ) : r.combo >= DEPOSIT ? (
        <Result good>
          <p><strong>A combination works.</strong> A year of your income ({baht(r.monthTHB * 12)}) plus savings in a Thai bank ({baht(r.saveTHB)}) comes to {baht(r.combo)}, over the ฿800,000 needed.</p>
          <p>Not every immigration office handles the combination the same way, so this is one to do with an agent.</p>
        </Result>
      ) : (
        <Result good={false}>
          <p><strong>You're about {baht(DEPOSIT - r.combo)} short</strong> of the ฿800,000 a year (income for 12 months plus savings) the retirement visa needs.</p>
          <p>Options: save towards the deposit before you move, or look at whether another visa fits you better.</p>
          <p><a href="/thai-visas" onClick={handleLinkClick} className="text-gold-deep underline">Compare the other visas</a></p>
        </Result>
      ))}
      <p className="mt-5 text-xs text-black/45">A guide, not legal advice. Rules change, so check the current requirements or use an agent before you apply.</p>
    </Shell>
  );
}

// ---------------- 90-day report and extension calendar ----------------

const DAY = 86_400_000;
const parse = (s: string) => (s ? new Date(s + "T00:00:00") : null);
const add = (d: Date, days: number) => new Date(d.getTime() + days * DAY);
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
const ics = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

interface Due {
  title: string;
  date: Date;
  note: string;
}

export function AdminCalendar({ source }: { source: string }) {
  const [last, setLast] = useState("");
  const [expiry, setExpiry] = useState("");

  const dues = useMemo<Due[]>(() => {
    const out: Due[] = [];
    const l = parse(last);
    if (l) {
      for (let i = 1; i <= 4; i++) {
        const due = add(l, 90 * i);
        out.push({ title: `90-day report${i > 1 ? ` (${i})` : ""}`, date: due, note: `Window opens ${fmt(add(due, -15))} and closes ${fmt(add(due, 7))}. Leaving Thailand resets the count.` });
      }
    }
    const e = parse(expiry);
    if (e) {
      out.push({ title: "Start your extension paperwork", date: add(e, -45), note: "Check the money is in place (retirement: ฿800,000 for 2 months) and book your agent." });
      out.push({ title: "Apply for your one-year extension", date: add(e, -30), note: `Most people apply in the 30 days before ${fmt(e)}. Check the exact window with your agent or immigration.` });
      out.push({ title: "Permission to stay ends", date: e, note: "Overstaying is fined per day and can get you banned. Don't let it lapse." });
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [last, expiry]);

  const download = () => {
    const now = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//shaneruddle.com//Thai visa dates//EN"];
    dues.forEach((d, i) => {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${ics(d.date)}-${i}@shaneruddle.com`,
        `DTSTAMP:${now}`,
        `DTSTART;VALUE=DATE:${ics(d.date)}`,
        `DTEND;VALUE=DATE:${ics(add(d.date, 1))}`,
        `SUMMARY:${d.title}`,
        `DESCRIPTION:${d.note.replace(/,/g, "\\,")}`,
        "BEGIN:VALARM",
        "TRIGGER:-P3D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${d.title}`,
        "END:VALARM",
        "END:VEVENT",
      );
    });
    lines.push("END:VCALENDAR");
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "thai-visa-dates.ics";
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("admin_calendar_download", { source, events: dues.length });
  };

  return (
    <Shell icon={<CalendarDays className="w-4 h-4" />} eyebrow="Visa date calendar" title="When is my next 90-day report due?" intro="Enter the date you last arrived in Thailand (or last reported), and when your current permission to stay ends. You'll get your dates and a calendar file with reminders.">
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <label className="block">
          <span className="block text-sm font-medium text-ink mb-2">Last arrival or last 90-day report</span>
          <input type="date" value={last} onChange={(e) => setLast(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-black/15 bg-paper" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-ink mb-2">Permission to stay ends (optional)</span>
          <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-black/15 bg-paper" />
        </label>
      </div>
      {dues.length > 0 && (
        <>
          <ol className="space-y-3 mb-6">
            {dues.map((d) => (
              <li key={d.title + d.date.getTime()} className="p-4 rounded-xl bg-paper border border-black/[0.06]">
                <span className="block font-serif text-lg text-ink">{d.title}: {fmt(d.date)}</span>
                <span className="block text-sm text-black/60">{d.note}</span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={download} className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors">
            <CalendarDays className="w-4 h-4" /> Add to my calendar
          </button>
        </>
      )}
      <p className="mt-5 text-xs text-black/45">A guide, not legal advice. Your permission-to-stay date is the last stamp in your passport. Check dates with immigration or your agent.</p>
    </Shell>
  );
}
