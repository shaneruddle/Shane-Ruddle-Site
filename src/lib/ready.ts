// "Are you ready for Pattaya?" readiness score (/ready-for-pattaya).
// 15 yes/no questions in 5 areas, 20 points per area, 100 in total. Every "no" becomes a fix that
// points to the article or tool on the site that sorts it out. Answers live in the URL so a score
// can be shared and reopened. Figures come from Shane's articles and the visa pages.

export const READY_PATH = "/ready-for-pattaya";

export const READY_META = {
  title: "Are You Ready to Move to Pattaya? Take the 2-Minute Readiness Score",
  description:
    "15 yes/no questions on money, visas, health cover, home and day-to-day life. Get a score out of 100, see your weakest area, and the exact steps to fix it, from someone who's lived in Pattaya for 20 years.",
};

export type ReadyWho = "retiring" | "remote" | "family" | "other";

export const WHO_OPTIONS: { id: ReadyWho; label: string; note: string }[] = [
  { id: "retiring", label: "Retiring", note: "50 or over, living on a pension or savings" },
  { id: "remote", label: "Working remotely", note: "Earning online from clients or an employer abroad" },
  { id: "family", label: "Moving with family", note: "Partner, children or both" },
  { id: "other", label: "Something else", note: "Still deciding, or a mix of these" },
];

export type ReadyAreaId = "money" | "visa" | "health" | "home" | "life";

export const AREAS: { id: ReadyAreaId; label: string; short: string }[] = [
  { id: "money", label: "Money", short: "Money" },
  { id: "visa", label: "Visa", short: "Visa" },
  { id: "health", label: "Health cover", short: "Health" },
  { id: "home", label: "Home and getting around", short: "Home" },
  { id: "life", label: "Day-to-day life", short: "Life" },
];

export interface ReadyFix {
  /** What to do, one sentence. */
  text: string;
  href: string;
  /** Button label, e.g. "Open the cost calculator". */
  cta: string;
}

export interface ReadyQuestion {
  id: string;
  area: ReadyAreaId;
  /** The question, optionally tailored to who is moving. */
  text: string | ((who: ReadyWho) => string);
  fix: ReadyFix | ((who: ReadyWho) => ReadyFix);
}

export const QUESTIONS: ReadyQuestion[] = [
  // ---- Money ----
  {
    id: "budget",
    area: "money",
    text: (who) =>
      who === "family"
        ? "Have you worked out a monthly budget for your family in Pattaya, school fees included?"
        : "Have you worked out what your month in Pattaya will actually cost?",
    fix: { text: "Put your own rent, food, transport and extras into the calculator and see the real monthly number.", href: "/cost-of-living-calculator", cta: "Open the cost calculator" },
  },
  {
    id: "income",
    area: "money",
    text: "Does your income cover that budget without eating into your savings every month?",
    fix: { text: "A single person needs around ฿50,000 to ฿60,000 a month to live comfortably. If you're short, look at a cheaper area or a smaller condo before you look at a smaller life.", href: "/articles/is-pattaya-expensive", cta: "Is Pattaya expensive?" },
  },
  {
    id: "cushion",
    area: "money",
    text: "Do you have money set aside for emergencies, separate from your monthly budget?",
    fix: { text: "Keep a cushion for the things nobody plans for: a hospital bill over your limit, a flight home, a landlord who keeps the deposit. Your retirement here is your responsibility.", href: "/articles/your-retirement-is-your-responsibility", cta: "Why it matters" },
  },
  // ---- Visa ----
  {
    id: "which-visa",
    area: "visa",
    text: "Do you know which visa you'll live here on?",
    fix: { text: "Answer a few questions and the visa finder tells you which visa fits, what it costs and what it needs.", href: "/thai-visas", cta: "Find my visa" },
  },
  {
    id: "visa-money",
    area: "visa",
    text: (who) =>
      who === "retiring"
        ? "Can you show the money the retirement visa needs: ฿800,000 in a Thai bank, ฿65,000 a month income, or a mix?"
        : who === "remote"
          ? "Can you show the savings your visa needs (around ฿500,000 for the DTV)?"
          : "Can you show the money your visa needs?",
    fix: (who) =>
      who === "retiring"
        ? { text: "Check whether your income, savings or a mix of both qualifies, and how long the money has to sit in the bank.", href: "/thai-visas/retirement-visa", cta: "Check my visa money" }
        : who === "remote"
          ? { text: "The DTV needs around ฿500,000 in savings, usually held for a few months before you apply. Check the current rules.", href: "/thai-visas/dtv-visa", cta: "DTV visa explained" }
          : { text: "Every long-stay visa has a money rule. Find your visa first, then check what it asks for and how long the money has to be there.", href: "/thai-visas", cta: "Find my visa" },
  },
  {
    id: "visa-admin",
    area: "visa",
    text: "Do you know about 90-day reports, TM30 and the yearly visa renewal?",
    fix: { text: "Living here comes with regular paperwork. Miss a 90-day report and you pay a fine. Put the dates in your calendar now.", href: "/articles/tm30-and-90-day-report-pattaya", cta: "90-day reports and TM30" },
  },
  // ---- Health ----
  {
    id: "insured",
    area: "health",
    text: "Do you have health insurance that covers you in Thailand, not just travel cover?",
    fix: { text: "Get insurance before you need it. Private hospitals here are first class, but you pay at the counter, and insurance gets harder to buy the older you are.", href: "/articles/healthcare-in-pattaya", cta: "Healthcare in Pattaya" },
  },
  {
    id: "limits",
    area: "health",
    text: "Do you know your policy's yearly limit and what it won't cover?",
    fix: { text: "Every policy has a limit, and a big claim can skyrocket quickly. Read your limits and exclusions now, not in the hospital.", href: "/articles/healthcare-in-pattaya", cta: "What to check in a policy" },
  },
  {
    id: "plan-b",
    area: "health",
    text: "Do you have a plan for what you'd do if something serious happened?",
    fix: { text: "Health is the main reason I see retirees go home. Decide now whether you'd be treated here or fly home, and how you'd pay for it.", href: "/articles/do-retirees-leave-pattaya", cta: "Why retirees leave" },
  },
  // ---- Home and getting around ----
  {
    id: "area",
    area: "home",
    text: "Have you picked the area of Pattaya that suits you?",
    fix: { text: "Jomtien, Pratumnak, Central Pattaya, Naklua and East Pattaya are very different places to live. Find the one that fits how you live.", href: "/areas", cta: "Find my area" },
  },
  {
    id: "rent-first",
    area: "home",
    text: "Will you rent for at least the first year before you buy anything?",
    fix: { text: "Rent first, ideally for a few years. Most landlords want 12 months, with two months' deposit and a month in advance.", href: "/articles/renting-a-condo-in-pattaya", cta: "Renting a condo" },
  },
  {
    id: "transport",
    area: "home",
    text: "Do you know how you'll get around, and whether your driving licence is valid here?",
    fix: { text: "Check what your licence from home lets you drive, and whether you need an International Driving Permit or a Thai licence.", href: "/articles/international-driving-permit-thailand", cta: "Check my licence" },
  },
  // ---- Day-to-day life ----
  {
    id: "lived-not-holidayed",
    area: "life",
    text: "Have you spent at least a few weeks in Pattaya living normally, not on holiday?",
    fix: { text: "A holiday isn't the same as a Tuesday in the rainy season. Come for a month, rent a condo, shop, cook and do the boring things.", href: "/articles/first-month-in-pattaya", cta: "Your first month" },
  },
  {
    id: "people",
    area: "life",
    text: (who) =>
      who === "family"
        ? "Do you have a plan for school and for meeting other families?"
        : "Do you have a plan for meeting people: a club, golf, a hobby or a regular spot?",
    fix: (who) =>
      who === "family"
        ? { text: "Pick the school first and the area second. The school gate is also where you'll meet most of your friends.", href: "/international-schools-pattaya", cta: "Choose a school" }
        : { text: "The people who thrive here build a routine and a circle. Join something in your first month.", href: "/articles/making-friends-in-pattaya", cta: "Making friends" },
  },
  {
    id: "downsides",
    area: "life",
    text: "Are you comfortable with the downsides: always on a visa, no land ownership, paperwork?",
    fix: { text: "Know the real downsides before you come. If you can live with them, commit fully and treat it as home from day one.", href: "/articles/what-i-wish-id-known-before-moving-to-thailand", cta: "What I wish I'd known" },
  },
];

export const questionText = (q: ReadyQuestion, who: ReadyWho) => (typeof q.text === "function" ? q.text(who) : q.text);
export const questionFix = (q: ReadyQuestion, who: ReadyWho) => (typeof q.fix === "function" ? q.fix(who) : q.fix);

/** One answer per question, in QUESTIONS order: true = yes, false = no, undefined = not answered. */
export type ReadyAnswers = (boolean | undefined)[];

export type Tier = "ready" | "nearly" | "not-yet";

export const TIERS: Record<Tier, { label: string; line: string }> = {
  ready: {
    label: "Ready to go",
    line: "You've done the homework most people skip. Tidy up anything below and start booking.",
  },
  nearly: {
    label: "Nearly there",
    line: "The big pieces are in place, but there are gaps that catch people out in their first year. Fix these before you sign anything.",
  },
  "not-yet": {
    label: "Not yet",
    line: "Not a no, just not yet. Work through the list below, start with your weakest area, and take the score again in a few weeks.",
  },
};

export interface ReadyResult {
  score: number;
  tier: Tier;
  areas: { id: ReadyAreaId; label: string; score: number; yes: number; of: number }[];
  weakest: ReadyAreaId;
  fixes: { area: ReadyAreaId; question: string; fix: ReadyFix }[];
}

export function scoreReady(who: ReadyWho, answers: ReadyAnswers): ReadyResult {
  const areas = AREAS.map((a) => {
    const qs = QUESTIONS.map((q, i) => ({ q, i })).filter(({ q }) => q.area === a.id);
    const yes = qs.filter(({ i }) => answers[i] === true).length;
    return { id: a.id, label: a.label, yes, of: qs.length, score: Math.round((yes / qs.length) * 20) };
  });
  const yesTotal = answers.filter((x) => x === true).length;
  const score = Math.round((yesTotal / QUESTIONS.length) * 100);
  const tier: Tier = score >= 80 ? "ready" : score >= 50 ? "nearly" : "not-yet";
  // Weakest area: fewest yes answers; ties go to the earlier (more fundamental) area.
  const weakest = areas.reduce((w, a) => (a.yes < w.yes ? a : w), areas[0]).id;
  // Fixes: weakest area first, then the rest in area order.
  const order = [weakest, ...AREAS.map((a) => a.id).filter((id) => id !== weakest)];
  const fixes = order.flatMap((areaId) =>
    QUESTIONS.map((q, i) => ({ q, i }))
      .filter(({ q, i }) => q.area === areaId && answers[i] === false)
      .map(({ q }) => ({ area: areaId, question: questionText(q, who), fix: questionFix(q, who) })),
  );
  return { score, tier, areas, weakest, fixes };
}

export const areaLabel = (id: ReadyAreaId) => AREAS.find((a) => a.id === id)?.label ?? id;

// ---- URL: ?who=retiring&a=110101... (1 = yes, 0 = no) ----

export const readyQuery = (who: ReadyWho, answers: ReadyAnswers) =>
  `?who=${who}&a=${answers.map((x) => (x ? "1" : "0")).join("")}`;

export function readyFromSearch(search: string): { who?: ReadyWho; answers?: ReadyAnswers } {
  const p = new URLSearchParams(search);
  const who = p.get("who") as ReadyWho | null;
  const a = p.get("a") || "";
  const validWho = who && WHO_OPTIONS.some((w) => w.id === who) ? who : undefined;
  if (!validWho) return {};
  if (a.length !== QUESTIONS.length || /[^01]/.test(a)) return { who: validWho };
  return { who: validWho, answers: a.split("").map((c) => c === "1") };
}

export function readySummary(who: ReadyWho, r: ReadyResult): string {
  const whoLabel = WHO_OPTIONS.find((w) => w.id === who)?.label ?? "";
  const lines = [
    `Your Pattaya readiness score: ${r.score}/100. ${TIERS[r.tier].label}`,
    `Moving as: ${whoLabel}`,
    ...r.areas.map((a) => `${a.label}: ${a.score}/20`),
    `Weakest area: ${areaLabel(r.weakest)}`,
  ];
  if (r.fixes.length) {
    lines.push("What to sort out next:");
    r.fixes.forEach((f, i) => lines.push(`${i + 1}. ${f.fix.text} (${f.fix.cta}: https://shaneruddle.com${f.fix.href})`));
  } else {
    lines.push("You said yes to everything. Book the flight.");
  }
  return lines.join("\n");
}

export const READY_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "How do I know if I'm ready to move to Pattaya?",
    a: "Check five things: your money covers a realistic monthly budget, you know which visa you'll be on and can prove its money rule, you have proper health insurance, you've picked an area and will rent first, and you've spent a few weeks here living normally, not on holiday.",
  },
  {
    q: "How much money do I need to live in Pattaya?",
    a: "A single person needs around ฿50,000 to ฿60,000 a month to live comfortably. Couples and families need more, and rent and school fees make the biggest difference.",
    href: "/cost-of-living-calculator",
  },
  {
    q: "What do I need for a Thai retirement visa?",
    a: "You need to be 50 or over and show ฿800,000 in a Thai bank, an income of ฿65,000 a month, or a mix of the two adding up to ฿800,000 a year.",
    href: "/thai-visas/retirement-visa",
  },
  {
    q: "Do I need health insurance to live in Pattaya?",
    a: "Yes. The private hospitals are very good, but you pay at the counter and uninsured patients can be turned away. Buy it before you need it, and check the yearly limit.",
    href: "/articles/healthcare-in-pattaya",
  },
  {
    q: "Should I buy or rent when I first move to Pattaya?",
    a: "Rent, ideally for a few years. Living somewhere for a year tells you far more than any viewing, and you can always buy later.",
    href: "/articles/renting-a-condo-in-pattaya",
  },
  {
    q: "What is a good readiness score?",
    a: "80 or more means you've done the homework and can start booking. 50 to 79 means the big pieces are in place but there are gaps to fix. Under 50 means start with your weakest area and take the score again.",
  },
];
