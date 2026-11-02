// "Plan my move" (/move-to-thailand): six questions build a personal, month-by-month moving plan.
// It reuses the other tools' logic so every figure matches them: recommendVisa (visas.ts),
// matchArea (areas.ts), calculate (costOfLiving.ts) and matchSchools (schools.ts).
// Advice in the tasks is condensed from Shane's articles; keep it in step if an article changes.

import { AreaId, MatchAnswers, PattayaArea, ecreUrl, matchArea } from "./areas";
import { CALCULATOR_PATH, CostInputs, Currency, calculate, formatBaht, formatMoney, inputsToQuery } from "./costOfLiving";
import { SchoolMatch, matchSchools, SCHOOLS_PATH, baht } from "./schools";
import { ThaiVisa, VisaAnswers, VISAS_PATH, recommendVisa } from "./visas";

export const MOVE_PATH = "/move-to-thailand";

export const MOVE_META = {
  title: "Moving to Thailand (2026): Free Personal Move Plan, From a 20-Year Pattaya Resident | Shane Ruddle",
  description:
    "Planning a move to Thailand from the UK, Germany, Australia or the US? Answer six questions and get a month-by-month plan: your visa, area, monthly budget, schools and first-week checklist.",
};

export type MoveQuestionId = "from" | "when" | "who" | "why" | "budget" | "home";
export type MoveAnswers = Partial<Record<MoveQuestionId, string>>;

export interface MoveQuestion {
  id: MoveQuestionId;
  question: string;
  hint?: string;
  options: { id: string; label: string }[];
}

/** Monthly household budget bands, in baht. */
export const BUDGET_BANDS: { id: string; min: number; max: number }[] = [
  { id: "low", min: 0, max: 50000 },
  { id: "mid", min: 50000, max: 90000 },
  { id: "high", min: 90000, max: 150000 },
  { id: "top", min: 150000, max: Infinity },
];

export const MOVE_QUESTIONS: MoveQuestion[] = [
  {
    id: "from",
    question: "Where are you moving from?",
    options: [
      { id: "uk", label: "The UK" },
      { id: "de", label: "Germany, Austria or Switzerland" },
      { id: "au", label: "Australia" },
      { id: "us", label: "The USA" },
      { id: "other", label: "Somewhere else" },
    ],
  },
  {
    id: "when",
    question: "When are you hoping to move?",
    options: [
      { id: "soon", label: "In the next 3 months" },
      { id: "half", label: "In 3 to 6 months" },
      { id: "year", label: "In 6 to 12 months" },
      { id: "exploring", label: "I'm still deciding" },
    ],
  },
  {
    id: "who",
    question: "Who's coming?",
    options: [
      { id: "single", label: "Just me" },
      { id: "couple", label: "Me and my partner" },
      { id: "family", label: "My family, with children" },
    ],
  },
  {
    id: "why",
    question: "What will you be doing here?",
    hint: "This decides your visa, so pick the closest.",
    options: [
      { id: "retire50", label: "Retiring, and I'm 50 or over" },
      { id: "retireEarly", label: "Retiring early, under 50" },
      { id: "remote", label: "Working online for clients or a company abroad" },
      { id: "work", label: "A job or my own business in Thailand" },
      { id: "trying", label: "Trying it out for a few months first" },
    ],
  },
  {
    id: "budget",
    question: "What's your monthly budget for everything?",
    hint: "Rent, food, getting around and fun, for the whole household.",
    options: BUDGET_BANDS.map((b) => ({ id: b.id, label: "" })),
  },
  {
    id: "home",
    question: "Are you planning to rent or buy?",
    options: [
      { id: "rent", label: "Rent" },
      { id: "buy", label: "Buy, eventually" },
      { id: "unsure", label: "Not sure yet" },
    ],
  },
];

export const CURRENCY_FOR: Record<string, Currency> = { uk: "GBP", de: "EUR", au: "AUD", us: "USD", other: "USD" };
export const currencyFor = (a: MoveAnswers): Currency => CURRENCY_FOR[a.from ?? ""] ?? "GBP";

/** "฿50,000 to ฿90,000 (about £1,120 to £2,020)". */
export function budgetLabel(id: string, currency: Currency) {
  const b = BUDGET_BANDS.find((x) => x.id === id)!;
  if (b.min === 0) return { main: `Under ${formatBaht(b.max)}`, sub: `about ${formatMoney(b.max, currency)}` };
  if (b.max === Infinity) return { main: `Over ${formatBaht(b.min)}`, sub: `about ${formatMoney(b.min, currency)}` };
  return { main: `${formatBaht(b.min)} to ${formatBaht(b.max)}`, sub: `about ${formatMoney(b.min, currency)} to ${formatMoney(b.max, currency)}` };
}

export function optionLabel(q: MoveQuestion, id: string | undefined, currency: Currency) {
  if (!id) return "-";
  if (q.id === "budget") {
    const l = budgetLabel(id, currency);
    return `${l.main} a month (${l.sub})`;
  }
  return q.options.find((o) => o.id === id)?.label ?? "-";
}

// ---- Answers → the other tools' inputs ----

function visaAnswers(a: MoveAnswers): VisaAnswers {
  const purpose = { retire50: "retire", retireEarly: "retire", remote: "remote", work: "work", trying: "holiday" }[a.why ?? ""] ?? "holiday";
  return {
    purpose,
    age: a.why === "retire50" ? "over50" : "under50",
    stay: a.why === "trying" || a.when === "exploring" ? "half" : "long",
    money: a.budget === "low" ? "mid" : "high",
    future: a.why === "work" ? "yes" : "no",
    pay: "no",
  };
}

function areaAnswers(a: MoveAnswers): MatchAnswers {
  const retired = a.why === "retire50" || a.why === "retireEarly";
  return {
    who: a.who === "family" ? "family" : retired ? "retired" : a.who === "couple" ? "couple" : "single",
    want: a.who === "family" ? "space" : retired ? "beach" : a.why === "work" ? "buzz" : "mix",
    budget: a.budget === "low" ? "low" : a.budget === "mid" ? "mid" : "high",
    extras: a.who === "family" ? "car" : "none",
  };
}

function costInputs(a: MoveAnswers, area: AreaId): CostInputs {
  const family = a.who === "family";
  const rich = a.budget === "high" || a.budget === "top";
  return {
    household: a.who === "single" ? "single" : "couple",
    kids: family ? 2 : 0,
    area: area === "najomtien" ? "jomtien" : area,
    home: family ? (a.budget === "top" ? "housePool" : "house") : rich ? "condo2" : "condo1",
    food: a.budget === "low" ? "cook" : a.budget === "top" ? "out" : "mix",
    transport: family || rich ? "carRent" : a.budget === "low" ? "grab" : "bikeRent",
    school: a.budget === "top" ? "top" : "lower",
    health: a.why === "retire50" ? "insured50" : "insured",
    goingOut: a.budget !== "low",
    currency: currencyFor(a),
  };
}

// ---- The plan ----

export interface PlanTask {
  id: string;
  title: string;
  body: string;
  link?: { label: string; href: string; external?: boolean };
  /** Shane's own words, shown as a quote. */
  shane?: boolean;
}

export interface PlanPhase {
  id: string;
  label: string;
  /** e.g. "January 2027", or "Right now". */
  when: string;
  tasks: PlanTask[];
}

export interface MovePlan {
  visa: ThaiVisa;
  visaRunnerUp: ThaiVisa;
  visaNotes: string[];
  area: PattayaArea;
  areaRunnerUp: PattayaArea;
  cost: ReturnType<typeof calculate>;
  costInputs: CostInputs;
  calculatorHref: string;
  /** True when the estimate is above the budget they picked. */
  overBudget: boolean;
  schools: SchoolMatch[];
  phases: PlanPhase[];
  currency: Currency;
}

const LEAD_MONTHS: Record<string, number | null> = { soon: 2, half: 5, year: 9, exploring: null };

const monthName = (d: Date) => d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

export function buildPlan(a: MoveAnswers, today = new Date()): MovePlan {
  const v = recommendVisa(visaAnswers(a));
  const m = matchArea(areaAnswers(a));
  const inputs = costInputs(a, m.area.id);
  const cost = calculate(inputs);
  const band = BUDGET_BANDS.find((b) => b.id === a.budget);
  const family = a.who === "family";
  const retiring = a.why === "retire50" || a.why === "retireEarly";
  const visa = v.best;
  const areaName = m.area.name;
  const currency = currencyFor(a);
  const household = family ? "two adults and two children" : a.who === "couple" ? "a couple" : "one person";
  const calcHref = `${CALCULATOR_PATH}${inputsToQuery(inputs)}`;
  const schools = family
    ? matchSchools({
        age: "primary",
        curriculum: "any",
        budget: a.budget === "top" ? "high" : a.budget === "high" ? "mid" : "low",
        area: m.area.id === "east" || m.area.id === "jomtien" || m.area.id === "central" || m.area.id === "najomtien" ? m.area.id : m.area.id === "pratumnak" ? "jomtien" : "central",
        priority: "run",
      }).slice(0, 3)
    : [];
  const longStayVisa = ["retirement", "business", "marriage", "education"].includes(visa.id);

  const t = (id: string, title: string, body: string, link?: PlanTask["link"], shane = false): PlanTask => ({ id, title, body, link, shane });
  const tasks: Record<string, PlanTask[]> = { before6: [], before3: [], before1: [], week1: [], month1: [], month3: [], year1: [] };

  // Six months out: decide.
  if (a.why === "trying" || a.when === "exploring") {
    tasks.before6.push(
      t("trial", "Come for a long trial stay first",
        "Living here isn't the same as a holiday. A lot of people visit for a month or two, love it and move here, then find it feels different once they slip back into a normal routine. Some end up splitting the year between home and here.",
        { label: "What I wish I'd known before moving", href: "/articles/what-i-wish-id-known-before-moving-to-thailand" }, true)
    );
  }
  tasks.before6.push(
    t("budget", "Check your budget against real figures",
      `For ${household} in ${areaName}, I'd plan on about ${formatBaht(cost.total)} a month (${formatMoney(cost.total, currency)}). Change anything that doesn't fit you in the calculator.`,
      { label: "Open my budget in the calculator", href: calcHref })
  );
  if (visa.id === "retirement") {
    tasks.before6.push(
      t("money", "Plan the ฿800,000 for your retirement visa",
        "You'll need ฿800,000 in a Thai bank, ฿65,000 a month income, or a mix of the two. The deposit usually has to sit in the account for 2 months before you apply, so plan when you'll move the money.",
        { label: "Retirement visa requirements", href: `${VISAS_PATH}/retirement-visa` })
    );
  }
  if (a.why === "work") {
    tasks.before6.push(
      t("nonb", "Line up a Thai company for your work permit",
        "To work or run a business here you need a Non-Immigrant B visa and a work permit through a Thai company. Sort the company side first, because the visa follows from it.",
        { label: "Doing business in Pattaya", href: "/guides/doing-business-in-pattaya" })
    );
  }
  if (family) {
    tasks.before6.push(
      t("schools", "Shortlist schools and ask about places",
        `The schools nearest ${areaName} are on your plan below. Good schools fill up, so ask about places early and book visits.`,
        { label: "Compare all eight schools", href: SCHOOLS_PATH })
    );
  }
  if (a.home === "buy") {
    tasks.before6.push(
      t("rentfirst", "Plan to rent first, even though you want to buy",
        "Even if you've visited plenty of times, rent before you buy. Most people move more than once as their life here changes, and you'll buy far better once you know the areas.",
        { label: "Buying property in Pattaya", href: "/guides/buying-property-in-pattaya" }, true)
    );
  }

  // Three months out: apply and insure.
  tasks.before3.push(
    t("visa", `Apply for your ${visa.name.replace(/ \(.*\)$/, "")}`,
      `It's your best fit because ${visa.fit}. Rules change often, so check the official site before you apply. I've always used a visa agent: there are plenty in Pattaya and they make it a lot less painful.`,
      { label: `${visa.name}: requirements and steps`, href: `${VISAS_PATH}/${visa.slug}` }, false)
  );
  tasks.before3.push(
    t("insurance", "Get health insurance before you need it",
      "The care here is first class, but uninsured patients can be turned away by private hospitals. Every policy has a limit, so check yours. My family is with Pacific Cross through a local broker.",
      { label: "Healthcare in Pattaya", href: "/articles/healthcare-in-pattaya" }, true)
  );
  tasks.before3.push(
    t("transfers", "Sort out how you'll send money over",
      `Wise is still a good option, and high street banks have become much more reasonable. The fee is usually small: where they make their money is the exchange rate, so always check the rate.${a.from === "uk" ? " If you'll draw a UK State Pension, check on gov.uk how it's paid abroad, as it isn't increased each year in Thailand." : ""}`,
      { label: "Banking in Thailand", href: "/articles/banking-in-thailand-for-foreigners" })
  );
  if (family) {
    tasks.before3.push(t("visits", "Visit or video-call your shortlisted schools", "Ask about the school run from where you'll live. It matters more than people think."));
  }

  // One month out: pack the paperwork.
  tasks.before1.push(
    t("paperwork", "Pack the paperwork",
      "Your passport with at least 6 months left, your driving licence from home (without it you'll take the full Thai driving test), passport photos and every document from your visa application.")
  );
  tasks.before1.push(
    t("shortstay", `Book your first few weeks in ${areaName}`,
      `Somewhere short-term, so you can look at places to rent in person.${m.runnerUp ? ` If you're torn, ${m.runnerUp.name} is your runner-up area: see both before you sign anything.` : ""}`,
      { label: `${areaName}: my area guide`, href: `/areas/${m.area.slug}` })
  );

  // First week.
  tasks.week1.push(t("sim", "Get a Thai SIM first", "It gets you online, and these days that's essential: for maps, paying for things, checking things and doing your research.", undefined, true));
  tasks.week1.push(
    t("walk", `Spend a whole day walking around ${areaName}`,
      "See what restaurants there are and who lives there. The biggest mistake people make choosing an area is not exploring enough.")
  );
  tasks.week1.push(
    t("rent", "Rent below your budget to start with",
      "Short lets are hard to find: you might get a six-month lease, but often it's 12 months. Choose somewhere below your budget, make sure you really enjoy living here, then scale up.",
      { label: `Browse rentals in ${areaName}`, href: ecreUrl("move_planner"), external: true }, true)
  );

  // First month: the admin.
  tasks.month1.push(
    t("bank", "Open a Thai bank account",
      "Once your visa is set up. Banks are much stricter since the scam-centre crackdown and want proof you live here, such as a long lease. These days I'd try Kasikorn Bank (KBank) first.",
      { label: "Banking in Thailand", href: "/articles/banking-in-thailand-for-foreigners" }, true)
  );
  tasks.month1.push(
    t("licence", "Get a Thai driving licence",
      "My top tip. It makes life so much easier, from police checkpoints to using it as ID instead of your passport. Go to the licence office very early, as they limit how many people they see each day.",
      { label: "Getting a Thai driving licence", href: "/articles/thai-driving-licence" }, true)
  );
  tasks.month1.push(t("hospital", "Find your hospital", "You don't need to register, but know where the hospitals are and what your insurance covers. We've always used Bangkok Hospital Pattaya.", undefined, true));
  if (longStayVisa) {
    tasks.month1.push(t("ninety", "Put your 90-day report in the diary", "Long-stay visas mean reporting your address every 90 days, in person, by post or online. And get a re-entry permit before you travel, or leaving cancels your extension."));
  }

  // Months two and three.
  tasks.month3.push(
    t("advice", "Don't take the advice of the guy in the bar",
      "You meet someone who's lived here far longer than you and take what he says as the truth. Plenty of people are misinformed, and living somewhere a long time doesn't mean you know how things work. Check things for yourself.",
      undefined, true)
  );
  tasks.month3.push(
    t("friends", "Get out of holiday mode",
      "Overspending in holiday mode is an easy mistake. Build a routine, join something and make friends who live here.",
      { label: "Making friends in Pattaya", href: "/articles/making-friends-in-pattaya" })
  );

  // After a year.
  if (a.home !== "rent") {
    tasks.year1.push(
      t("buy", "Now think about buying",
        "After a year you'll know which area you love and which you don't. Foreigners can own a condo, within the building's 49% foreign quota. Houses are different, because foreigners can't own land, so read up first.",
        { label: "Buying a condo in Pattaya", href: "/articles/buying-a-condo-in-pattaya" })
    );
  }
  if (visa.id === "retirement") tasks.year1.push(t("renew", "Renew your retirement extension", "At the immigration office in Jomtien, ฿1,900, every year."));
  tasks.year1.push(
    t("roots", "Put down roots",
      "If I'd known how much I was going to enjoy it here, I would have treated it as my home from the start and put down roots earlier.",
      undefined, true)
  );

  // Dates: each phase sits a number of months from the move.
  const lead = LEAD_MONTHS[a.when ?? ""] ?? null;
  const PHASES: [string, string, number][] = [
    ["before6", "Six months before", -6],
    ["before3", "Three months before", -3],
    ["before1", "One month before", -1],
    ["week1", "Your first week", 0],
    ["month1", "Your first month", 1],
    ["month3", "Months two and three", 3],
    ["year1", "After a year", 12],
  ];
  const phases: PlanPhase[] = [];
  for (const [id, label, offset] of PHASES) {
    if (!tasks[id].length) continue;
    let when: string;
    let name = label;
    if (lead === null) when = offset < 0 ? `${-offset} month${offset === -1 ? "" : "s"} before you move` : offset === 0 ? "When you land" : `${offset} month${offset === 1 ? "" : "s"} after you land`;
    else {
      const monthsFromNow = lead + offset;
      if (offset < 0 && monthsFromNow <= 0) {
        // Already late for this step: fold it into "Right now".
        const now = phases.find((p) => p.id === "now");
        if (now) {
          now.tasks.push(...tasks[id]);
          continue;
        }
        name = "Right now";
        when = "Start this month";
        phases.push({ id: "now", label: name, when, tasks: [...tasks[id]] });
        continue;
      }
      const d = new Date(today.getFullYear(), today.getMonth() + monthsFromNow, 1);
      when = monthName(d);
    }
    phases.push({ id, label: name, when, tasks: tasks[id] });
  }

  return {
    visa,
    visaRunnerUp: v.runnerUp,
    visaNotes: v.notes,
    area: m.area,
    areaRunnerUp: m.runnerUp,
    cost,
    costInputs: inputs,
    calculatorHref: calcHref,
    overBudget: !!band && cost.total > band.max,
    schools,
    phases,
    currency,
  };
}

/** Plain-text plan, sent to Shane with the visitor's question. */
export function planSummary(a: MoveAnswers, p: MovePlan) {
  const answers = MOVE_QUESTIONS.map((q) => `${q.question} ${optionLabel(q, a[q.id], p.currency)}`);
  const lines = [
    "Move planner answers:",
    ...answers,
    "",
    "Their plan:",
    `Visa: ${p.visa.name} (runner-up ${p.visaRunnerUp.name})`,
    `Area: ${p.area.name} (runner-up ${p.areaRunnerUp.name})`,
    `Estimated monthly cost: ${formatBaht(p.cost.total)} (${formatMoney(p.cost.total, p.currency)})${p.overBudget ? ", above their budget" : ""}`,
  ];
  if (p.schools.length) lines.push(`Schools: ${p.schools.map((s) => `${s.school.name}${s.fee ? ` (~${baht(s.fee)}/yr)` : ""}`).join(", ")}`);
  lines.push(`Move date: ${p.phases.find((x) => x.id === "week1")?.when ?? "-"}`);
  return lines.join("\n");
}

export const answersQuery = (a: MoveAnswers) =>
  "?" + MOVE_QUESTIONS.filter((q) => a[q.id]).map((q) => `${q.id}=${a[q.id]}`).join("&");

export function answersFromSearch(search: string): MoveAnswers {
  const p = new URLSearchParams(search);
  const out: MoveAnswers = {};
  for (const q of MOVE_QUESTIONS) {
    const v = p.get(q.id);
    if (v && q.options.some((o) => o.id === v)) out[q.id] = v;
  }
  return out;
}

// ---- Page copy and FAQ (also published as FAQPage structured data) ----

export const MOVE_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "How do I move to Thailand from the UK?",
    a: "Pick the visa that fits what you'll do here (a retirement visa if you're 50 or over, the DTV if you work online, a Non-B and work permit for a job or business). Get health insurance, rent before you buy, then open a bank account and get a Thai driving licence in your first month.",
  },
  {
    q: "How much money do I need to move to Thailand?",
    a: "Two figures matter. For the visa: ฿800,000 in a Thai bank (or ฿65,000 a month) for retirement, or about ฿500,000 in savings for the DTV. To live: in Pattaya I'd tell a friend about ฿35,000 to ฿75,000 a month per adult to live comfortably, going out once a week.",
    href: CALCULATOR_PATH,
  },
  {
    q: "Should I rent or buy when I move to Thailand?",
    a: "Rent first, even if you've visited plenty of times. Choose somewhere below your budget, make sure you really enjoy living here, then scale up or buy.",
    href: "/articles/renting-a-condo-in-pattaya",
  },
  {
    q: "What should I sort out first when I arrive?",
    a: "A Thai SIM in week one, then somewhere to rent. Once your visa is set up, open a bank account, then get a Thai driving licence. You don't need to register with a hospital, but know where they are.",
    href: "/articles/first-month-in-pattaya",
  },
  {
    q: "Can I retire to Thailand?",
    a: "Yes, if you're 50 or over and can show ฿800,000 in a Thai bank, ฿65,000 a month income, or a combination of the two. You extend it every year at immigration, which costs ฿1,900.",
    href: `${VISAS_PATH}/retirement-visa`,
  },
  {
    q: "What's the biggest mistake people make moving to Thailand?",
    a: "Taking the wrong advice: someone in a bar who has lived here longer than you isn't necessarily right. The other is ending up on a visa that doesn't suit what you might want to do in a few years.",
    href: "/articles/what-i-wish-id-known-before-moving-to-thailand",
  },
];
