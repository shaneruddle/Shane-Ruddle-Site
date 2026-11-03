// "Buying a business in Pattaya" chapter at /business-in-pattaya/buying-a-business.
// The deal checker scores one specific listing against Shane's buying rules. All copy and rules
// are condensed from his buying series (why-buy, valuing, leases, taking-over) and
// starting-or-buying-a-business (Nov 2026).

import { BUSINESS_PATH } from "./businessCheck";

export const BUYING_PATH = `${BUSINESS_PATH}/buying-a-business`;

export const BUYING_META = {
  title: "Buying a Business in Pattaya: Free Deal Checker From a 7-Business Owner | Shane Ruddle",
  description:
    "Found a bar, restaurant or guesthouse for sale in Pattaya? Check the deal against the rules I use: a fair price (2 to 4 times profit), the lease and landlord, the company, the staff and how to pay.",
};

export const ARTICLES = {
  why: "/articles/why-buy-a-business-in-pattaya",
  value: "/articles/valuing-a-business-in-pattaya",
  lease: "/articles/business-leases-and-landlords-in-pattaya",
  takeover: "/articles/taking-over-a-business-in-pattaya",
  basics: "/articles/starting-or-buying-a-business-in-pattaya",
};

// ---- Questions (choice fields) ----

export type DealField = "type" | "years" | "accounts" | "seller" | "sale" | "landlord" | "customers" | "keyMoney" | "staff" | "payment";

export interface DealChoice {
  id: DealField;
  label: string;
  hint?: string;
  options: { id: string; label: string }[];
}

export const DEAL_CHOICES: DealChoice[] = [
  {
    id: "type",
    label: "What kind of business is it?",
    options: [
      { id: "restaurant", label: "Restaurant or bar" },
      { id: "guesthouse", label: "Guesthouse" },
      { id: "service", label: "Service business" },
      { id: "entertainment", label: "Go-go, nightclub or Walking Street" },
    ],
  },
  {
    id: "years",
    label: "How long has it been trading?",
    options: [
      { id: "under2", label: "Under 2 years" },
      { id: "2to5", label: "2 to 5 years" },
      { id: "over5", label: "Over 5 years" },
    ],
  },
  {
    id: "accounts",
    label: "What numbers have you seen?",
    options: [
      { id: "audited", label: "Proper, audited accounts" },
      { id: "internal", label: "Internal accounts" },
      { id: "word", label: "Just what the seller tells me" },
    ],
  },
  {
    id: "seller",
    label: "Why is the owner selling?",
    options: [
      { id: "staying", label: "Moving on, but staying in Pattaya" },
      { id: "leaving", label: "Leaving Thailand" },
      { id: "unclear", label: "They haven't really said" },
    ],
  },
  {
    id: "sale",
    label: "What exactly is for sale?",
    options: [
      { id: "company", label: "The company itself" },
      { id: "newco", label: "The business, but I'd set up a new company" },
      { id: "leaseOnly", label: "Just the lease and the fittings" },
    ],
  },
  {
    id: "landlord",
    label: "Have you met the landlord?",
    options: [
      { id: "met", label: "Yes, I've met them" },
      { id: "notYet", label: "Not yet" },
      { id: "seller", label: "The seller says I don't need to" },
    ],
  },
  {
    id: "customers",
    label: "Who are the customers?",
    options: [
      { id: "foreign", label: "Mostly foreigners" },
      { id: "mixed", label: "A mix" },
      { id: "thai", label: "Mostly Thais" },
    ],
  },
  {
    id: "keyMoney",
    label: "Is the landlord asking for key money?",
    options: [
      { id: "no", label: "No, just a deposit" },
      { id: "yes", label: "Yes" },
      { id: "unknown", label: "Don't know yet" },
    ],
  },
  {
    id: "staff",
    label: "What about the staff?",
    options: [
      { id: "settled", label: "Long-serving team, happy to stay" },
      { id: "faceLeaving", label: "The owner or manager is the face of the place" },
      { id: "unknown", label: "I don't know them yet" },
    ],
  },
  {
    id: "payment",
    label: "How would you pay?",
    options: [
      { id: "holdback", label: "Hold back at least 10% for a few months" },
      { id: "full", label: "The full price up front" },
    ],
  },
];

export type DealAnswers = Partial<Record<DealField, string>> & { price?: number; profit?: number; turnover?: number };

// ---- Price ----

/** Shane pays 2–4× annual profit: closer to 2 for a newer business, closer to 4 for a long-established one. */
const TOP_MULTIPLE: Record<string, number> = { under2: 2, "2to5": 3, over5: 4 };

export interface PriceView {
  multiple: number; // asking price ÷ annual profit
  fairLow: number;
  fairHigh: number;
  margin?: number; // profit ÷ turnover, restaurants and bars only
}

export function priceView(a: DealAnswers): PriceView | null {
  if (!a.price || !a.profit || a.profit <= 0) return null;
  const top = TOP_MULTIPLE[a.years ?? "2to5"] ?? 3;
  return {
    multiple: a.price / a.profit,
    fairLow: a.profit * 2,
    fairHigh: a.profit * top,
    margin: a.type === "restaurant" && a.turnover && a.turnover > 0 ? a.profit / a.turnover : undefined,
  };
}

export const fairRange = (p: PriceView) =>
  p.fairHigh > p.fairLow ? `${thbShort(p.fairLow)} to ${thbShort(p.fairHigh)}` : `about ${thbShort(p.fairLow)}`;

// ---- Verdict ----

export type Severity = "red" | "amber" | "green";

export interface DealFlag {
  id: string;
  severity: Severity;
  title: string;
  text: string;
  href: string;
}

export interface DealResult {
  flags: DealFlag[];
  reds: number;
  ambers: number;
  greens: number;
  verdict: Severity;
  headline: string;
  price: PriceView | null;
  /** The questions Shane would ask the seller, from the flags. */
  questions: string[];
}

export const thb = (n: number) => `฿${Math.round(n).toLocaleString("en-GB")}`;
export const thbShort = (n: number) =>
  n >= 1_000_000 ? `฿${+(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} million` : n >= 1_000 ? `฿${Math.round(n / 1_000).toLocaleString("en-GB")}k` : thb(n);

export function checkDeal(a: DealAnswers): DealResult {
  const flags: DealFlag[] = [];
  const questions: string[] = [];
  const add = (f: DealFlag, q?: string) => {
    flags.push(f);
    if (q) questions.push(q);
  };

  if (a.type === "entertainment") {
    add(
      { id: "entertainment", severity: "red", title: "This is the one side of Pattaya I'd never buy into", text: "Go-go bars, nightclubs, Walking Street. The risk is very high and you can be at the mercy of the authorities. The most I'd ever do is a 5 or 10% stake with money I could afford to lose.", href: ARTICLES.takeover },
      "What licences does it hold, and has it ever been closed or fined?"
    );
  }

  // Price
  const price = priceView(a);
  if (price) {
    const top = TOP_MULTIPLE[a.years ?? "2to5"] ?? 3;
    if (price.multiple > 4) {
      add(
        { id: "price_high", severity: "red", title: `Asking ${price.multiple.toFixed(1)} times profit`, text: `I pay two to four times annual profit, and four only for a business that's been trading for many years. On these numbers I'd be looking at ${fairRange(price)}.`, href: ARTICLES.value },
        "How did you arrive at the asking price?"
      );
    } else if (price.multiple > top) {
      add(
        { id: "price_stretch", severity: "amber", title: `Asking ${price.multiple.toFixed(1)} times profit`, text: `Inside my range, but high for how long it's been trading. A newer business is worth closer to two times; I'd be aiming for ${fairRange(price)}.`, href: ARTICLES.value },
        "Can you show me how the profit has moved year by year?"
      );
    } else {
      add({ id: "price_ok", severity: "green", title: `Asking ${price.multiple.toFixed(1)} times profit`, text: "That's within what I'd pay for a business with this track record, if the profit figure is real.", href: ARTICLES.value });
    }
    if (price.margin !== undefined) {
      const pct = Math.round(price.margin * 100);
      if (price.margin > 0.2) {
        add(
          { id: "margin_high", severity: "amber", title: `${pct}% profit on turnover`, text: "A typical restaurant and bar here makes about 10%, and a really good one 15 to 20%. When the accounts show a lot more than that, ask why.", href: ARTICLES.value },
          "Which costs aren't in these figures: your own wages, rent increases, repairs?"
        );
      } else if (price.margin >= 0.1) {
        add({ id: "margin_ok", severity: "green", title: `${pct}% profit on turnover`, text: "Believable. About 10% is typical for a restaurant and bar here; 15 to 20% is a really good one.", href: ARTICLES.value });
      } else {
        add({ id: "margin_low", severity: "amber", title: `${pct}% profit on turnover`, text: "Below the 10% a typical restaurant and bar makes. That's either a problem or room for improvement, so find out which.", href: ARTICLES.value }, "Where do you think the margin is being lost?");
      }
    }
  }

  // Accounts
  if (a.accounts === "word") {
    add({ id: "accounts_word", severity: "red", title: "No numbers you can check", text: "Most small businesses here don't have audited books, but you need something: accounts, bank statements, supplier bills. Without them you're buying a story.", href: ARTICLES.value }, "Can I see bank statements and supplier bills for the last 12 months?");
  } else if (a.accounts === "internal") {
    add({ id: "accounts_internal", severity: "amber", title: "Internal accounts only", text: "Normal here, but treat them with caution. If you don't know the trade, get someone who does to look at turnover against costs.", href: ARTICLES.value }, "Can I see bank statements and supplier bills to back the accounts up?");
  } else if (a.accounts === "audited") {
    add({ id: "accounts_ok", severity: "green", title: "Audited accounts", text: "Better than most. Still check them against the bank statements.", href: ARTICLES.value });
  }

  // Seller
  if (a.seller === "unclear") {
    add({ id: "seller_unclear", severity: "red", title: "No clear reason to sell", text: "Why they're selling matters as much as the numbers. Ask, then check the answer with staff, neighbours and other owners nearby.", href: ARTICLES.value }, "Why are you selling, and why now?");
  } else if (a.seller === "leaving") {
    add({ id: "seller_leaving", severity: "amber", title: "The seller is leaving Thailand", text: "Someone who's staying in Pattaya won't risk their reputation in a town this size. Someone who won't be around afterwards needs more checking, and a bigger holdback.", href: ARTICLES.value }, "Will you be reachable for questions for three months after the sale?");
  } else if (a.seller === "staying") {
    add({ id: "seller_ok", severity: "green", title: "The seller is staying in Pattaya", text: "Their reputation here is worth more than ripping you off, and you'll be able to call them for advice.", href: ARTICLES.value });
  }

  // What's for sale
  if (a.sale === "leaseOnly") {
    add({ id: "lease_only", severity: "red", title: "It's only the lease and the fittings", text: "You're not buying a business, you're buying a tenancy and some furniture. Price it like that, not on someone else's profit.", href: ARTICLES.basics }, "What exactly is included: the name, the customers, the stock, the staff?");
  } else if (a.sale === "newco") {
    add({ id: "newco", severity: "amber", title: "A new company instead of taking over the old one", text: "I've always taken over the existing company. If you don't want to because you're not sure what's in it, that's a red flag in itself. Find out why.", href: ARTICLES.lease }, "Is there anything in the company I should know about: debts, disputes, unpaid tax?");
  } else if (a.sale === "company") {
    add({ id: "company_ok", severity: "green", title: "Taking over the company", text: "That's how I always do it. You take on its liabilities, so get a Thai lawyer to check them before you sign.", href: ARTICLES.lease });
  }

  // Landlord
  if (a.landlord === "seller") {
    add({ id: "landlord_blocked", severity: "red", title: "The seller doesn't want you to meet the landlord", text: "I always meet the landlord before I buy. Not to ask about their plans, but to get a sense of who they are and whether they'd want to run the place themselves.", href: ARTICLES.lease }, "When can I meet the landlord?");
  } else if (a.landlord === "notYet") {
    add({ id: "landlord_notyet", severity: "amber", title: "You haven't met the landlord yet", text: "Do it before you pay anything. Do they own lots of property? Would they ever want to be an operator? Most are happy taking 5 to 7% on their investment.", href: ARTICLES.lease }, "When can I meet the landlord?");
  } else if (a.landlord === "met") {
    add({ id: "landlord_ok", severity: "green", title: "You've met the landlord", text: "Good. That meeting tells you more about the lease than the paperwork does.", href: ARTICLES.lease });
  }
  if (a.customers === "thai") {
    add({ id: "thai_customers", severity: "amber", title: "Mostly Thai customers", text: "I've known landlords wait until a business was busy and take it over. That's a bigger risk when the customers are Thai, because the landlord could run it themselves.", href: ARTICLES.lease }, "How many years are left on the lease, and what are the renewal terms in writing?");
  }

  // Key money
  if (a.keyMoney === "yes") {
    add({ id: "key_money", severity: "amber", title: "Key money", text: "I've never paid it. I'll pay a deposit, but I negotiate to add the equivalent to the rent monthly instead. Otherwise it's a lump you have to find every time the lease comes round.", href: ARTICLES.lease }, "Would the landlord take the key money as extra monthly rent instead?");
  }

  // Staff
  if (a.staff === "faceLeaving") {
    add({ id: "face", severity: "amber", title: "The place is built around one person", text: "When we took over the bar that became Hemingways Jomtien, some regulars stopped coming because the popular manager had gone. Most came back within months, out of habit, but plan for the dip.", href: ARTICLES.why }, "Will the manager stay through the handover?");
  } else if (a.staff === "unknown") {
    add({ id: "staff_unknown", severity: "amber", title: "You don't know the team yet", text: "Find out who's key and how long everyone has been there. You take on their length of service, and severance for long-serving staff can run to many months' pay.", href: ARTICLES.lease }, "How long has each member of staff been here, and who's key?");
  } else if (a.staff === "settled") {
    add({ id: "staff_ok", severity: "green", title: "A settled, long-serving team", text: "That's what keeps a business going. Remember you take on their length of service and the severance that comes with it, so factor it into the price.", href: ARTICLES.lease });
  }

  // Payment
  if (a.payment === "full") {
    add({ id: "pay_full", severity: "red", title: "Paying everything up front", text: "I never do. I hold back at least 10%, paid a few months later. It keeps the seller involved in the handover and gives you leverage when problems turn up, and they usually do.", href: ARTICLES.takeover }, "Would you accept 10% of the price three months after handover?");
  } else if (a.payment === "holdback") {
    add({ id: "holdback_ok", severity: "green", title: "Holding back at least 10%", text: "Exactly what I do. It keeps the seller interested in a smooth handover.", href: ARTICLES.takeover });
  }

  const reds = flags.filter((f) => f.severity === "red").length;
  const ambers = flags.filter((f) => f.severity === "amber").length;
  const greens = flags.filter((f) => f.severity === "green").length;
  const verdict: Severity = reds > 0 ? "red" : ambers > 2 ? "amber" : "green";
  const headline =
    verdict === "red"
      ? reds > 1
        ? `${reds} things would stop me signing.`
        : "One thing would stop me signing."
      : verdict === "amber"
        ? "Worth pursuing, with some hard questions first."
        : "This looks like a deal I'd take seriously.";

  // Red flags first, then amber, then green.
  const order: Record<Severity, number> = { red: 0, amber: 1, green: 2 };
  flags.sort((x, y) => order[x.severity] - order[y.severity]);

  return { flags, reds, ambers, greens, verdict, headline, price, questions };
}

export function answeredCount(a: DealAnswers): number {
  return DEAL_CHOICES.filter((c) => a[c.id]).length + (a.price && a.profit ? 1 : 0);
}

/** Plain-text summary sent to Shane with "Send me the listing". */
export function dealSummary(a: DealAnswers, r: DealResult): string {
  const label = (id: DealField) => DEAL_CHOICES.find((c) => c.id === id)?.options.find((o) => o.id === a[id])?.label ?? "-";
  const lines = ["DEAL CHECK"];
  for (const c of DEAL_CHOICES) if (a[c.id]) lines.push(`${c.label} ${label(c.id)}`);
  if (a.price) lines.push(`Asking price: ${thb(a.price)}`);
  if (a.profit) lines.push(`Annual profit claimed: ${thb(a.profit)}`);
  if (a.turnover) lines.push(`Annual turnover: ${thb(a.turnover)}`);
  if (r.price) lines.push(`Multiple: ${r.price.multiple.toFixed(1)}x profit (fair range ${thb(r.price.fairLow)}–${thb(r.price.fairHigh)})`);
  lines.push(`Verdict: ${r.headline} (${r.reds} red, ${r.ambers} amber, ${r.greens} green)`);
  lines.push(`Red/amber flags: ${r.flags.filter((f) => f.severity !== "green").map((f) => f.id).join(", ") || "none"}`);
  return lines.join("\n");
}

// ---- URL sharing ----

export function dealQuery(a: DealAnswers): string {
  const p = new URLSearchParams();
  for (const c of DEAL_CHOICES) if (a[c.id]) p.set(c.id, a[c.id]!);
  for (const k of ["price", "profit", "turnover"] as const) if (a[k]) p.set(k, String(a[k]));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function dealFromSearch(search: string): DealAnswers {
  const p = new URLSearchParams(search);
  const out: DealAnswers = {};
  for (const c of DEAL_CHOICES) {
    const v = p.get(c.id);
    if (v && c.options.some((o) => o.id === v)) out[c.id] = v;
  }
  for (const k of ["price", "profit", "turnover"] as const) {
    const n = Number(p.get(k));
    if (Number.isFinite(n) && n > 0) out[k] = Math.round(n);
  }
  return out;
}

// ---- The chapter: Shane's buying playbook ----

export const PLAYBOOK: { n: string; title: string; points: string[]; href: string; read: string }[] = [
  {
    n: "01",
    title: "Buy, don't start",
    points: [
      "It takes about three years to build a core of regulars. When you buy, you're buying those three years.",
      "A business that's trading has already answered the biggest question: is there a market?",
      "If the owner was the face of the place, some regulars will drift off. Most come back within months, out of habit.",
    ],
    href: ARTICLES.why,
    read: "Why I'd buy rather than start",
  },
  {
    n: "02",
    title: "Value it properly",
    points: [
      "A typical restaurant and bar makes about 10% on turnover; a really good one 15 to 20%. Much more than that, ask why.",
      "I pay two to four times annual profit: closer to two for a newer business, four for one with years behind it.",
      "Why they're selling matters as much as the numbers. A seller staying in Pattaya won't risk their reputation.",
    ],
    href: ARTICLES.value,
    read: "How to value a business",
  },
  {
    n: "03",
    title: "Lease, landlord and company",
    points: [
      "Three-plus-three leases are the norm. If it's traded in one spot for years, I worry about the landlord more than the years left.",
      "Always meet the landlord. Never pay key money: negotiate it into the monthly rent.",
      "Take over the existing company. You inherit staff service and severance, so find out how long everyone has been there.",
    ],
    href: ARTICLES.lease,
    read: "Leases, landlords and paperwork",
  },
  {
    n: "04",
    title: "Take over gently",
    points: [
      "Hold back at least 10% of the price, paid a few months later.",
      "Change nothing for the first three or four months. Work out who does what, and why.",
      "The biggest mistake I see: going in like a bull in a china shop to put your stamp on it.",
    ],
    href: ARTICLES.takeover,
    read: "Taking over: the first few months",
  },
];

export const BUYING_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "How much should I pay for a business in Pattaya?",
    a: "I work on two to four times annual profit. Closer to two for a business with a short track record, closer to four for one that's been trading for many years.",
    href: ARTICLES.value,
  },
  {
    q: "How much profit does a restaurant and bar in Pattaya make?",
    a: "As a rough guide, about 10% of turnover for a typical one, and 15 to 20% for a really good one. If the accounts show much more, ask why.",
    href: ARTICLES.value,
  },
  {
    q: "Should I pay key money for a business lease in Pattaya?",
    a: "I never have. I'll pay a reasonable deposit, but I negotiate to add the equivalent of the key money to the monthly rent instead.",
    href: ARTICLES.lease,
  },
  {
    q: "Should I take over the seller's company or start a new one?",
    a: "I've always taken over the existing company. You take on its liabilities, especially long-serving staff and their severance, so check those before you agree a price.",
    href: ARTICLES.lease,
  },
  {
    q: "Should I pay the full price when I buy a business?",
    a: "No. I always hold back at least 10%, paid a few months later. It keeps the seller involved in the handover and gives you leverage if problems come up.",
    href: ARTICLES.takeover,
  },
  {
    q: "Where do I find good businesses for sale in Pattaya?",
    a: "Usually not on Facebook or through agents. The best ones sell quietly, by word of mouth between business owners. Get to know other owners.",
    href: ARTICLES.takeover,
  },
];
