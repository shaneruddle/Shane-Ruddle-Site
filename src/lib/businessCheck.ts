// "Should I open a business in Pattaya?" reality check at /business-in-pattaya.
// Six answers → an honest verdict, a money check against Shane's rough start-up figures,
// the set-up checklist, and (when buying) a due-diligence scorecard.
// Copy is condensed from Shane's business articles; start-up figures are his (Nov 2026),
// except the service-business figure, which is an estimate (flagged in the UI).

export const BUSINESS_PATH = "/business-in-pattaya";

export const BUSINESS_META = {
  title: "Should I Open a Business in Pattaya? Free Reality Check From a 7-Business Owner | Shane Ruddle",
  description:
    "Thinking of opening a bar, restaurant or guesthouse in Pattaya? Answer six questions and get an honest verdict: what it costs to start, Thai partner and work permit rules, and a due-diligence checklist if you're buying.",
};

export type BizQuestionId = "type" | "route" | "budget" | "role" | "experience" | "who";
export type BizAnswers = Partial<Record<BizQuestionId, string>>;

export interface BizQuestion {
  id: BizQuestionId;
  question: string;
  hint?: string;
  options: { id: string; label: string; sub?: string }[];
}

export const BIZ_QUESTIONS: BizQuestion[] = [
  {
    id: "type",
    question: "What kind of business are you thinking of?",
    options: [
      { id: "bar", label: "A bar", sub: "Beer bar, sports bar, pub" },
      { id: "restaurant", label: "A restaurant", sub: "Or a restaurant and bar" },
      { id: "guesthouse", label: "A small guesthouse", sub: "A handful of rooms, maybe a café" },
      { id: "service", label: "A service business", sub: "Rental, agency, tours, repairs" },
    ],
  },
  {
    id: "route",
    question: "Start from scratch, or buy one that's already running?",
    options: [
      { id: "start", label: "Start from scratch", sub: "An empty unit and my own concept" },
      { id: "buy", label: "Buy an existing business", sub: "Customers and staff already in place" },
      { id: "unsure", label: "Not sure yet" },
    ],
  },
  {
    id: "budget",
    question: "How much money can you put in, in total?",
    hint: "Everything you could commit, including what you'd keep back to keep it going.",
    options: [
      { id: "under1m", label: "Under ฿1 million", sub: "Under about £23,000" },
      { id: "1to3m", label: "฿1 to 3 million", sub: "About £23,000 to £70,000" },
      { id: "3to5m", label: "฿3 to 5 million", sub: "About £70,000 to £115,000" },
      { id: "5to10m", label: "฿5 to 10 million", sub: "About £115,000 to £230,000" },
      { id: "over10m", label: "Over ฿10 million", sub: "Over about £230,000" },
    ],
  },
  {
    id: "role",
    question: "How involved will you be?",
    options: [
      { id: "run", label: "I'll live here and run it day to day" },
      { id: "partTime", label: "I'll run it, but split my time abroad" },
      { id: "invest", label: "I'll invest and let someone else run it" },
    ],
  },
  {
    id: "experience",
    question: "Have you run a business before?",
    options: [
      { id: "none", label: "No, this would be my first" },
      { id: "home", label: "Yes, back home", sub: "But not in Thailand" },
      { id: "here", label: "Yes, in Thailand or in this trade" },
    ],
  },
  {
    id: "who",
    question: "Who are you doing it with?",
    options: [
      { id: "alone", label: "On my own" },
      { id: "friend", label: "A friend or partner from home" },
      { id: "thai", label: "A Thai partner or my Thai spouse" },
      { id: "experienced", label: "Someone who's already done it here" },
    ],
  },
];

// ---- Money ----

/** Shane's rough figure to get each kind of business going (Nov 2026). */
export const START_UP: Record<string, { amount: number; label: string; fromShane: boolean }> = {
  bar: { amount: 1_000_000, label: "a bar", fromShane: true },
  restaurant: { amount: 3_000_000, label: "a restaurant", fromShane: true },
  guesthouse: { amount: 5_000_000, label: "a small guesthouse", fromShane: true },
  service: { amount: 1_000_000, label: "a service business", fromShane: false },
};

const BUDGET_RANGE: Record<string, [number, number]> = {
  under1m: [0, 1_000_000],
  "1to3m": [1_000_000, 3_000_000],
  "3to5m": [3_000_000, 5_000_000],
  "5to10m": [5_000_000, 10_000_000],
  over10m: [10_000_000, Infinity],
};

export type MoneyFit = "short" | "tight" | "comfortable";

export function moneyFit(type: string, budget: string): MoneyFit {
  const need = START_UP[type]?.amount ?? 1_000_000;
  const [low, high] = BUDGET_RANGE[budget] ?? [0, 0];
  if (high <= need) return "short";
  if (low < need * 1.5) return "tight";
  return "comfortable";
}

// ---- Verdict ----

export interface Point {
  id: string;
  text: string;
  /** Article that backs the point up. */
  href?: string;
}

export type VerdictLevel = "good" | "caution" | "rethink";

export interface BizResult {
  level: VerdictLevel;
  score: number; // 0–100, higher = better odds
  headline: string;
  summary: string;
  flags: Point[];
  strengths: Point[];
  money: { fit: MoneyFit; need: number; needFromShane: boolean; text: string };
  permit: { needed: boolean; text: string };
  ownership: string;
  routeNote: string;
  showDueDiligence: boolean;
}

const A = {
  starting: "/articles/starting-or-buying-a-business-in-pattaya",
  restaurant: "/articles/running-a-restaurant-and-bar-in-pattaya",
  partners: "/articles/business-partners-in-pattaya",
  failure: "/articles/my-biggest-business-failure",
  timeline: "/articles/bar-manager-to-7-businesses",
  staff: "/articles/managing-thai-staff",
  foreignStaff: "/articles/hiring-foreign-staff-in-pattaya",
  visas: "/thai-visas/business-visa-work-permit",
};

export const BAHT = (n: number) => `฿${n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)} million` : n.toLocaleString("en-GB")}`;

export function assess(a: BizAnswers): BizResult {
  const flags: Point[] = [];
  const strengths: Point[] = [];
  let risk = 0;
  const type = a.type ?? "bar";
  const hospitality = type === "bar" || type === "restaurant";

  // Type
  if (type === "bar") {
    risk += 3;
    flags.push({
      id: "bar",
      text: "Bars are the businesses I see fail most, often because the owner is their own best customer. They're cheap to buy and run, which is exactly why they change hands so often.",
      href: A.starting,
    });
  } else if (type === "restaurant") {
    risk += 1;
    strengths.push({ id: "restaurant", text: "Restaurants do work here. I own three. But it looks easy from the outside, and it really, really isn't.", href: A.restaurant });
  } else if (type === "guesthouse") {
    strengths.push({ id: "guesthouse", text: "Guesthouses are one of the types I see work in Pattaya, along with restaurants and entertainment.", href: A.starting });
  } else {
    strengths.push({ id: "service", text: "Service businesses are my own preference. They need less money up front, and there's a real need here for better service.", href: A.starting });
  }

  // Route
  if (a.route === "start") {
    risk += 1;
    flags.push({ id: "start", text: "Building a customer base from nothing takes far longer than people expect. Budget for the slow months before it's known.", href: A.starting });
  } else if (a.route === "buy") {
    strengths.push({ id: "buy", text: "Buying something with customers already in place saves you years. At my stage, I'd always rather buy than start.", href: A.starting });
  }

  // Money
  const fit = moneyFit(type, a.budget ?? "under1m");
  const need = START_UP[type] ?? START_UP.bar;
  if (fit === "short") {
    risk += 3;
    flags.push({ id: "money_short", text: `Your budget is below the roughly ${BAHT(need.amount)} I'd expect ${need.label} to take. Most businesses that fail simply run out of money.`, href: A.failure });
  } else if (fit === "tight") {
    risk += 1;
    flags.push({ id: "money_tight", text: "You'd cover the start-up, but with little left to keep it going while it builds. Most businesses that fail run out of money first.", href: A.failure });
  } else {
    strengths.push({ id: "money_ok", text: "You have room to keep going through a slow first year, which is when most businesses here run out of money.", href: A.failure });
  }

  // Role
  if (a.role === "partTime") {
    risk += 2;
    flags.push({ id: "part_time", text: "You have to be here. A new business needs driving all the time, and almost every good deal I've done came from being in the right room. That doesn't happen from abroad.", href: A.timeline });
  } else if (a.role === "invest") {
    risk += 1;
    flags.push({ id: "invest", text: "As an investor, everything depends on who's driving it. They should hold the control, not you, and your agreement needs to say exactly who does what.", href: A.partners });
  } else if (a.role === "run") {
    strengths.push({ id: "run", text: "You'll be here running it yourself. That's the single biggest thing in your favour.", href: A.timeline });
  }

  // Experience
  if (a.experience === "none") {
    risk += 2;
    flags.push({ id: "first", text: "My first big business, a golf range, failed. I went in with my heart, not my calculator. Run the numbers before you fall for the idea.", href: A.failure });
  } else if (a.experience === "home") {
    risk += 1;
    flags.push({ id: "home", text: "Experience back home helps, but things work differently here. The people who struggle don't learn how Thais operate and aren't willing to.", href: A.staff });
  } else if (a.experience === "here") {
    strengths.push({ id: "here", text: "You already know how business works here. That puts you ahead of most people who ask me.", href: A.timeline });
  }

  // Who
  if (a.who === "alone" && hospitality) {
    risk += 1;
    flags.push({ id: "alone", text: "For a bar or restaurant, don't go it alone. Team up with somebody who's already doing it, or has done it before.", href: A.restaurant });
  } else if (a.who === "friend") {
    flags.push({ id: "friend", text: "Don't split it 50-50 just because there are two of you. Someone has to have the majority and be in control, and that should be the person driving it. Put it all in writing, with an exit clause.", href: A.partners });
  } else if (a.who === "thai") {
    flags.push({ id: "thai", text: "Your Thai partner has to be a genuine partner who invests and shares in the decisions. A name on the paperwork is a nominee, and nominee shareholding is illegal.", href: A.starting });
  } else if (a.who === "experienced") {
    strengths.push({ id: "experienced", text: "You're teaming up with someone who's done it here. That's exactly what I'd tell a friend to do.", href: A.restaurant });
  }

  const score = Math.max(5, Math.min(95, 92 - risk * 8));
  const level: VerdictLevel = risk <= 2 ? "good" : risk <= 6 ? "caution" : "rethink";
  const headline =
    level === "good" ? "You're set up better than most." : level === "caution" ? "It can work, but go in with your eyes open." : "I'd think hard before doing this.";
  const summary =
    level === "good"
      ? "The basics are in your favour. Now it comes down to doing your homework properly and taking it seriously."
      : level === "caution"
        ? "Nothing here rules it out, but there are a few things I'd want sorted before you sign anything."
        : "As it stands, this has the hallmarks of the businesses I see fail. That doesn't mean never. It means fix the red flags first.";

  const money = {
    fit,
    need: need.amount,
    needFromShane: need.fromShane,
    text:
      fit === "short"
        ? `Below what I'd want to see. I'd expect ${need.label} to take about ${BAHT(need.amount)} to get going.`
        : fit === "tight"
          ? `Enough to get going (about ${BAHT(need.amount)} for ${need.label}), with little in reserve.`
          : `About ${BAHT(need.amount)} gets ${need.label} going, which leaves you a cushion to keep it running.`,
  };

  const permit =
    a.role === "invest"
      ? { needed: false, text: "Not necessarily. If you're a silent investor and not working in it, you may not need one. The moment you work in it, you do." }
      : { needed: true, text: "Yes. If you're working in your own business, you need one. Pay an agent about ฿20,000 to handle it; it's worth it." };

  const ownership =
    "For most businesses a foreigner can't hold the majority, so a genuine Thai partner holds 51%. Have a Thai lawyer set up the company and shareholding properly from the start.";

  const routeNote =
    a.route === "buy"
      ? "Buying costs more up front but saves you the years it takes to build customers. Use the checklist below before you pay a baht."
      : a.route === "start"
        ? "Starting can be cheaper up front, but the customers take far longer to come than you expect."
        : "Early on, starting from scratch feels easier and cheaper. With experience, I'd always rather buy something that already has customers.";

  return { level, score, headline, summary, flags, strengths, money, permit, ownership, routeNote, showDueDiligence: a.route !== "start" };
}

// ---- Buying: due-diligence scorecard ----

export const DUE_DILIGENCE: { id: string; title: string; body: string }[] = [
  { id: "accounts", title: "I've seen the real numbers", body: "Accounts, bank statements and supplier bills, not just the seller's word or a till printout." },
  { id: "why", title: "I know why the seller really wants out", body: "Ask, then check the answer with neighbours, staff and other owners nearby." },
  { id: "staff", title: "The staff are happy and staying", body: "You can buy a well-run business and watch the team walk out the day you take over." },
  { id: "licences", title: "Every licence is in place", body: "Some businesses run for years without the right paperwork. Three or four years old doesn't mean it's in order." },
  { id: "lease_only", title: "I know exactly what I'm buying", body: "Is it the business and its assets, or only the lease and the fittings? Plenty of 'sales' here are lease-only." },
  { id: "lease_term", title: "The lease is long enough, and the renewal is clear", body: "My golf range died at its renewal: the landlady wouldn't name the new rent. Get the terms in writing." },
  { id: "owners", title: "I've talked to other owners nearby", body: "They'll tell you things you won't find in a book, on YouTube, or in the seller's pitch." },
];

export function dueDiligenceVerdict(done: number): string {
  const total = DUE_DILIGENCE.length;
  if (done === total) return "All seven. Now get a Thai lawyer to check the paperwork before you pay.";
  if (done >= 5) return `${total - done} to go. Don't let anyone rush you into paying before they're done.`;
  if (done >= 2) return "A start, but I wouldn't pay a deposit yet.";
  return "Tick off what you've checked. I wouldn't pay a deposit until all seven are done.";
}

// ---- Worked examples from Shane's own businesses ----

export const CASES: { id: string; name: string; tag: string; lesson: string; body: string; href: string; types: string[] }[] = [
  {
    id: "fairways",
    name: "Fairways Golf Range",
    tag: "Started from scratch · failed after 3 years",
    lesson: "Heart, not calculator",
    body: "Fourteen rai of rented land and trays of balls at ฿35. That's an awful lot of trays just to cover the rent. Then the lease came up and the landlady wouldn't say what the new rent would be.",
    href: A.failure,
    types: ["start", "none", "bar", "restaurant", "guesthouse"],
  },
  {
    id: "prac",
    name: "Pattaya Rent a Car",
    tag: "Started from customer demand · 16 years and going",
    lesson: "Clear roles from day one",
    body: "Guests at the range kept asking where to rent a car. A friend put up the money as a silent partner and I ran it. It's worked because we both knew our roles.",
    href: "/articles/16-years-of-pattaya-rent-a-car",
    types: ["service", "invest", "friend", "start"],
  },
  {
    id: "hemingways",
    name: "Hemingways Jomtien",
    tag: "Took on an empty unit · now three sites",
    lesson: "Know the location's history",
    body: "I knew the previous operator at that unit had done well, so I jumped at it. Being a first mover in Jomtien helped, and keeping a core team for years did the rest.",
    href: A.restaurant,
    types: ["restaurant", "bar", "here", "experienced"],
  },
  {
    id: "ecre",
    name: "East Coast Real Estate",
    tag: "Bought an existing business",
    lesson: "Be here, and network",
    body: "The owner made an off-the-cuff remark about selling at a meeting. I called him the next day and asked for first refusal. Almost every good business I've bought came through someone I knew.",
    href: A.timeline,
    types: ["buy", "service", "partTime", "run", "unsure"],
  },
];

export function casesFor(a: BizAnswers) {
  const vals = Object.values(a);
  return [...CASES]
    .map((c) => ({ c, hits: c.types.filter((t) => vals.includes(t)).length }))
    .sort((x, y) => y.hits - x.hits)
    .map((x) => x.c);
}

// ---- URL sharing ----

export function answersQuery(a: BizAnswers): string {
  const p = new URLSearchParams();
  for (const q of BIZ_QUESTIONS) if (a[q.id]) p.set(q.id, a[q.id]!);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function answersFromSearch(search: string): BizAnswers {
  const p = new URLSearchParams(search);
  const out: BizAnswers = {};
  for (const q of BIZ_QUESTIONS) {
    const v = p.get(q.id);
    if (v && q.options.some((o) => o.id === v)) out[q.id] = v;
  }
  return out;
}

/** Plain-text summary sent to Shane with an Ask Shane question. */
export function checkSummary(a: BizAnswers, r: BizResult): string {
  const label = (id: BizQuestionId) => BIZ_QUESTIONS.find((q) => q.id === id)?.options.find((o) => o.id === a[id])?.label ?? "-";
  return [
    "BUSINESS REALITY CHECK",
    `Business: ${label("type")}`,
    `Route: ${label("route")}`,
    `Budget: ${label("budget")}`,
    `Involvement: ${label("role")}`,
    `Experience: ${label("experience")}`,
    `With: ${label("who")}`,
    `Verdict: ${r.headline} (${r.score}/100)`,
    `Red flags: ${r.flags.map((f) => f.id).join(", ") || "none"}`,
  ].join("\n");
}

// ---- FAQ (also published as FAQPage structured data) ----

export const BUSINESS_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "How much does it cost to open a bar in Pattaya?",
    a: "As a rough guide I'd say about ฿1 million to get a small bar going. Bars are cheap to buy and run, which is exactly why they change hands so often.",
    href: A.starting,
  },
  {
    q: "How much does it cost to open a restaurant in Pattaya?",
    a: "Roughly ฿3 million for a restaurant, and about ฿5 million for a small guesthouse. Keep money back as well: most businesses that fail run out of money.",
    href: A.restaurant,
  },
  {
    q: "Can a foreigner own a business in Thailand?",
    a: "For most businesses a foreigner can't hold the majority, so a genuine Thai partner holds 51%. Nominee shareholding is illegal, so have a Thai lawyer set it up properly.",
    href: A.starting,
  },
  {
    q: "Do I need a work permit to work in my own business in Thailand?",
    a: "Yes, if you're actively working in it. A silent investor doesn't necessarily need one. I'd pay an agent around ฿20,000 to handle it.",
    href: A.visas,
  },
  {
    q: "Is it better to start or buy a business in Pattaya?",
    a: "Starting can be cheaper up front, but building customers takes far longer than people expect. Buying costs more and saves you that time. At my stage, I'd always rather buy.",
    href: A.starting,
  },
  {
    q: "Why do so many bars in Pattaya fail?",
    a: "Often the owner is their own best customer. People buy a bar because they like the idea, don't take it seriously and aren't willing to learn how things work here.",
    href: A.starting,
  },
];
