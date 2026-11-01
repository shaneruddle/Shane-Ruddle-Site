// Pattaya cost of living calculator: every figure, option and answer in one place.
// Monthly baht, 2026. Figures come from Shane's articles where he has given one; the rest are
// his approved estimates. Update here and the page, the prerender and the FAQ schema all follow.

export type Household = "single" | "couple";
export type Area = "central" | "jomtien" | "pratumnak" | "wongamat" | "east";
export type Home = "condo1" | "condo2" | "house" | "housePool";
export type Food = "out" | "mix" | "cook";
export type Transport = "grab" | "bikeRent" | "bikeOwn" | "carRent" | "carOwn";
export type School = "none" | "lower" | "top";
export type Health = "insured" | "insured50" | "payg";
export type Currency = "THB" | "GBP" | "USD" | "EUR" | "AUD" | "RUB";

export interface CostInputs {
  household: Household;
  kids: number; // 0–4
  area: Area;
  home: Home;
  food: Food;
  transport: Transport;
  school: School;
  health: Health;
  goingOut: boolean;
  currency: Currency;
}

export const DEFAULT_INPUTS: CostInputs = {
  household: "single",
  kids: 0,
  area: "jomtien",
  home: "condo1",
  food: "out",
  transport: "bikeRent",
  school: "lower",
  health: "insured",
  goingOut: true,
  currency: "GBP",
};

type Option<T extends string> = { id: T; label: string; hint?: string };

export const HOUSEHOLDS: Option<Household>[] = [
  { id: "single", label: "Just me" },
  { id: "couple", label: "A couple" },
];

export const AREAS: Option<Area>[] = [
  { id: "central", label: "Central Pattaya", hint: "In the middle of everything, smaller rooms" },
  { id: "jomtien", label: "Jomtien", hint: "Beach, older buildings, more space for the money" },
  { id: "pratumnak", label: "Pratumnak", hint: "Quiet hill between town and Jomtien" },
  { id: "wongamat", label: "Wongamat / Naklua", hint: "Newer high-rises, one of the pricier areas" },
  { id: "east", label: "East Pattaya", hint: "Houses, schools, where most families live" },
];

export const HOMES: Option<Home>[] = [
  { id: "condo1", label: "1-bed condo" },
  { id: "condo2", label: "2-bed condo" },
  { id: "house", label: "House, no pool" },
  { id: "housePool", label: "House with pool" },
];

export const FOODS: Option<Food>[] = [
  { id: "out", label: "Eat out every meal" },
  { id: "mix", label: "Mix of both" },
  { id: "cook", label: "Mostly cook at home" },
];

export const TRANSPORTS: Option<Transport>[] = [
  { id: "grab", label: "Grab and baht buses" },
  { id: "bikeRent", label: "Rent a motorbike" },
  { id: "bikeOwn", label: "Own a motorbike" },
  { id: "carRent", label: "Long-term car rental" },
  { id: "carOwn", label: "Own a car" },
];

export const SCHOOLS: Option<School>[] = [
  { id: "none", label: "No international school" },
  { id: "lower", label: "International school, lower end" },
  { id: "top", label: "International school, top end" },
];

export const HEALTHS: Option<Health>[] = [
  { id: "insured", label: "Insurance (under 50)" },
  { id: "insured50", label: "Insurance (50+)" },
  { id: "payg", label: "Pay as I go" },
];

// ---- Monthly figures (baht) ----

// Rent by area and home type. Areas where a home type is rare get a realistic, not cheap, figure.
const RENT: Record<Area, Record<Home, number>> = {
  central: { condo1: 20000, condo2: 35000, house: 35000, housePool: 50000 },
  jomtien: { condo1: 18000, condo2: 30000, house: 35000, housePool: 45000 },
  pratumnak: { condo1: 22000, condo2: 35000, house: 40000, housePool: 55000 },
  wongamat: { condo1: 22000, condo2: 38000, house: 40000, housePool: 55000 },
  east: { condo1: 15000, condo2: 25000, house: 30000, housePool: 40000 },
};

const FOOD_ADULT: Record<Food, { single: number; couple: number }> = {
  out: { single: 30000, couple: 55000 },
  mix: { single: 18000, couple: 32000 },
  cook: { single: 10000, couple: 18000 },
};
const FOOD_PER_CHILD = 6000;

const TRANSPORT: Record<Transport, number> = {
  grab: 3000,
  bikeRent: 3000,
  bikeOwn: 1500,
  carRent: 12000,
  carOwn: 8000,
};

const SCHOOL_PER_CHILD: Record<School, number> = { none: 0, lower: 30000, top: 80000 };

const HEALTH_PER_ADULT: Record<Health, number> = { insured: 4000, insured50: 8000, payg: 2500 };

const BILLS = (adults: number, kids: number, home: Home) =>
  (adults === 1 && kids === 0 ? 2500 : kids ? 6000 : 4000) + (home === "housePool" ? 2500 : 0);
const PHONE = (adults: number) => (adults === 1 ? 1000 : 1500);
const GOING_OUT = (adults: number) => (adults === 1 ? 5000 : 8000);
const SPORT = (adults: number) => (adults === 1 ? 1500 : 3000);

// Approximate rates, baht per one unit of each currency (late August 2026).
export const RATES_AS_OF = "August 2026";
export const CURRENCIES: { id: Currency; symbol: string; perUnit: number }[] = [
  { id: "GBP", symbol: "£", perUnit: 44.5 },
  { id: "USD", symbol: "$", perUnit: 32.7 },
  { id: "EUR", symbol: "€", perUnit: 38.1 },
  { id: "AUD", symbol: "A$", perUnit: 23.4 },
  { id: "RUB", symbol: "₽", perUnit: 0.395 },
  { id: "THB", symbol: "฿", perUnit: 1 },
];

export interface CostLine {
  id: string;
  label: string;
  amount: number;
}

export function calculate(i: CostInputs) {
  const adults = i.household === "couple" ? 2 : 1;
  const kids = Math.max(0, Math.min(4, Math.round(i.kids)));
  const food = FOOD_ADULT[i.food][i.household] + kids * FOOD_PER_CHILD;
  const lines: CostLine[] = [
    { id: "rent", label: "Rent", amount: RENT[i.area][i.home] },
    { id: "food", label: "Food and drink", amount: food },
    { id: "transport", label: "Getting around", amount: TRANSPORT[i.transport] },
    { id: "bills", label: "Electricity, water, phone and internet", amount: BILLS(adults, kids, i.home) + PHONE(adults) },
    { id: "health", label: "Healthcare", amount: HEALTH_PER_ADULT[i.health] * adults + (i.health === "payg" ? 0 : kids * 2000) },
    { id: "school", label: "School fees", amount: kids ? SCHOOL_PER_CHILD[i.school] * kids : 0 },
    { id: "life", label: "Going out, gym and sport", amount: (i.goingOut ? GOING_OUT(adults) : 0) + SPORT(adults) },
  ].filter((l) => l.amount > 0);
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { lines, total, adults, kids };
}

export function verdict(total: number, adults: number, kids: number): string {
  if (kids) {
    return total > 150000
      ? "That's a very comfortable family life here, and the school fees are doing most of the heavy lifting."
      : "That's a realistic family budget. The big swing is schooling, so visit the schools before you decide.";
  }
  const perAdult = total / adults;
  if (perAdult < 35000) return "That's a lean budget. It's doable, but you'll be cooking and watching what you spend.";
  if (perAdult < 75000) return "That's about what I'd tell a friend they need to live comfortably here, going out once a week.";
  return "That's a very comfortable life in Pattaya. You won't be going without much.";
}

export function formatMoney(baht: number, currency: Currency) {
  const c = CURRENCIES.find((x) => x.id === currency) ?? CURRENCIES[0];
  const value = baht / c.perUnit;
  const rounded = currency === "THB" || currency === "RUB" ? Math.round(value / 100) * 100 : Math.round(value / 10) * 10;
  return `${c.symbol}${rounded.toLocaleString("en-GB")}`;
}
export const formatBaht = (baht: number) => `฿${Math.round(baht).toLocaleString("en-GB")}`;

// ---- Shareable URLs ----
const KEYS: (keyof CostInputs)[] = ["household", "kids", "area", "home", "food", "transport", "school", "health", "goingOut", "currency"];
const VALID: Partial<Record<keyof CostInputs, readonly string[]>> = {
  household: HOUSEHOLDS.map((o) => o.id),
  area: AREAS.map((o) => o.id),
  home: HOMES.map((o) => o.id),
  food: FOODS.map((o) => o.id),
  transport: TRANSPORTS.map((o) => o.id),
  school: SCHOOLS.map((o) => o.id),
  health: HEALTHS.map((o) => o.id),
  currency: CURRENCIES.map((o) => o.id),
};

export function inputsToQuery(i: CostInputs) {
  const p = new URLSearchParams();
  for (const k of KEYS) if (i[k] !== DEFAULT_INPUTS[k]) p.set(k, String(i[k]));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function inputsFromQuery(search: string): CostInputs {
  const p = new URLSearchParams(search);
  const out: CostInputs = { ...DEFAULT_INPUTS };
  for (const k of KEYS) {
    const v = p.get(k);
    if (v == null) continue;
    if (k === "kids") out.kids = Math.max(0, Math.min(4, parseInt(v, 10) || 0));
    else if (k === "goingOut") out.goingOut = v !== "false";
    else if (VALID[k]?.includes(v)) (out as unknown as Record<string, string>)[k] = v;
  }
  return out;
}

// ---- Page copy, FAQ (also published as FAQPage structured data) ----
export const CALCULATOR_PATH = "/cost-of-living-calculator";

export const CALCULATOR_FAQS: { q: string; a: string; slug?: string }[] = [
  {
    q: "How much do you need a month to live in Pattaya?",
    a: "As of 2026, a single person can live comfortably on about ฿50,000 to ฿60,000 a month, and a couple on ฿70,000 to ฿80,000, going out once a week rather than every night.",
    slug: "living-in-pattaya",
  },
  {
    q: "How much is rent in Pattaya?",
    a: "Budget around ฿18,000 to ฿20,000 a month for a one-bed condo of 30 to 45 square metres. That's the historical average across East Coast Real Estate and Alan Bolton Property Consultants.",
    slug: "renting-a-condo-in-pattaya",
  },
  {
    q: "How much does food cost in Pattaya?",
    a: "A meal out costs a couple of hundred baht, or about ฿300 with a drink. Eating out every meal comes to about ฿30,000 a month for one person, and much less if you cook some of your own.",
    slug: "is-pattaya-expensive",
  },
  {
    q: "What does it cost to raise a family in Pattaya?",
    a: "The big cost is school. Budget about ฿30,000 a month per child at the lower end of the international schools, and up to ฿100,000 at the top.",
    slug: "international-schools-in-pattaya",
  },
  {
    q: "Is Pattaya expensive?",
    a: "No. It's more expensive than a lot of Thailand, and cheaper than Phuket, but compared with almost anywhere else in the world that's worth living in, it isn't expensive at all.",
    slug: "is-pattaya-expensive",
  },
];
