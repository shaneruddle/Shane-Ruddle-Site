// Pattaya neighbourhood guides: the /areas hub (map + "which area suits you?" matcher) and one page
// per area at /areas/<slug>. Copy is condensed from the articles, mainly best-area-to-live-in-pattaya;
// keep it in step if an article's figures change. Rent figures come from the cost of living calculator.

import type { AskTopic } from "../components/AskShane";
import type { Area as CalcArea } from "./costOfLiving";

export const AREAS_PATH = "/areas";

export type AreaId = "wongamat" | "central" | "pratumnak" | "jomtien" | "najomtien" | "east";

export interface AreaPick {
  name: string;
  note: string;
  url?: string;
  /** One of Shane's own businesses. */
  mine?: boolean;
}

export interface AreaFaq {
  q: string;
  a: string;
}

export interface PattayaArea {
  id: AreaId;
  slug: string;
  name: string;
  tagline: string;
  metaTitle: string;
  description: string;
  verdict: string[];
  suits: string[];
  notFor: string[];
  /** What ฿20,000 a month rents here. */
  rent20k: string;
  /** Matching area in the cost of living calculator, for the rent table and the prefilled link. */
  calcArea?: CalcArea;
  picks: AreaPick[];
  faqs: AreaFaq[];
  articles: string[];
  askTopic: AskTopic;
  /** Map label position (viewBox 0 0 400 560). */
  label: { x: number; y: number };
  /** Map shape. */
  shape: { x: number; y: number; w: number; h: number };
}

const ECRE_BASE = "https://www.thaiproperty.com/";
export const ecreUrl = (campaign: string) =>
  `${ECRE_BASE}?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=${encodeURIComponent(campaign)}`;

export const AREAS: PattayaArea[] = [
  {
    id: "wongamat",
    slug: "wongamat-naklua",
    name: "Wongamat & Naklua",
    tagline: "Newer high-rises in the north of the city",
    metaTitle: "Living in Wongamat & Naklua, Pattaya: Rents, Condos and Who It Suits (2026) | Shane Ruddle",
    description:
      "Wongamat and Naklua from a 20-year Pattaya resident: the condo sois worth knowing, what ฿20,000 a month rents, who the area suits and who it doesn't.",
    verdict: [
      "Wongamat and Naklua, in the north of the city, are particularly popular with Russian residents, but anyone can enjoy living there. There are great restaurants, and Terminal 21 is within walking distance.",
      "If you want a condo, it's really all about Naklua Soi 18 and Soi 19, which meet halfway along. Away from those, the area is mostly hotels.",
    ],
    suits: ["Condo lovers who want a newer building", "People who like to walk to the shops", "Russian speakers, who'll find a ready-made community"],
    notFor: ["Tight budgets: it's one of the pricier areas", "Anyone who wants a house", "Pet owners, as few condos allow them"],
    rent20k: "Possibly only a small studio. It's one of the pricier areas.",
    calcArea: "wongamat",
    picks: [
      { name: "Naklua Soi 18 and Soi 19", note: "Where the condos are: Sky Beach, Northpoint, Arom and Nova Mirage." },
      { name: "Terminal 21", note: "Within walking distance for most of the area." },
      { name: "Centara in Naklua", note: "Lost World, the jungle-gym play area, is a great day out with kids." },
    ],
    faqs: [
      {
        q: "Is Wongamat a good place to live?",
        a: "Yes, especially if you want a newer condo. It's popular with Russian residents, but anyone can enjoy living there. There are great restaurants and Terminal 21 is within walking distance.",
      },
      {
        q: "Which condos are in Wongamat and Naklua?",
        a: "It's really all about Naklua Soi 18 and Soi 19. That's where you'll find buildings such as Sky Beach, Northpoint, Arom and Nova Mirage. Away from those two sois, the area is mostly hotels.",
      },
      {
        q: "Is Wongamat expensive?",
        a: "It's one of the pricier areas. ฿20,000 a month might only get you a small studio, where the same money gets a bigger one-bed in Jomtien.",
      },
    ],
    articles: ["best-area-to-live-in-pattaya", "renting-a-condo-in-pattaya", "buying-a-condo-in-pattaya", "things-to-do-in-pattaya"],
    askTopic: "renting",
    label: { x: 158, y: 78 },
    shape: { x: 40, y: 0, w: 210, h: 132 },
  },
  {
    id: "central",
    slug: "central-pattaya",
    name: "Central Pattaya",
    tagline: "In the middle of everything",
    metaTitle: "Living in Central Pattaya: Rents, Nightlife and Who It Suits (2026) | Shane Ruddle",
    description:
      "Is Central Pattaya a good place to live? A 20-year resident on who it suits, what ฿20,000 a month rents, where he eats, and where the nightlife really is now.",
    verdict: [
      "Central Pattaya is where the action is: restaurants, bars and the buzz of the city on your doorstep. If I were in my thirties again, that's where I'd be. It's where I started myself, before moving to Pratumnak.",
      "Space is the trade-off. Central is where your money buys the least.",
    ],
    suits: ["Young singles who want the buzz", "People who'd rather not drive", "Anyone who eats out most nights"],
    notFor: ["Families with children", "Anyone who wants space for their money", "Pet owners, as few condos allow them"],
    rent20k: "A small one-bed. Central is where your money buys the least.",
    calcArea: "central",
    picks: [
      { name: "Hemingways Pattaya", note: "My own sports bar and restaurant in Central Pattaya.", url: "https://www.hemingwayspattaya.com", mine: true },
      { name: "The Market", note: "Just in front of Central Festival. One of my favourites for a steak." },
      { name: "Beefeater Steakhouse", note: "Off Pattaya Second Road." },
      { name: "Soi Buakhao", note: "If I wanted a drink now, I'd skip Walking Street and go here." },
    ],
    faqs: [
      {
        q: "Is Central Pattaya a good place to live?",
        a: "Yes, if you're young and want the buzz. Restaurants, bars and shopping are on your doorstep. The trade-off is space: ฿20,000 a month gets you a small one-bed.",
      },
      {
        q: "Do I need a car in Central Pattaya?",
        a: "No. Most of what you need is close by, and Grab and the baht buses cover the rest. A car makes more sense once you move further out.",
      },
      {
        q: "Where is the nightlife in Pattaya now?",
        a: "Walking Street is still there, but it's changed a lot. If I wanted a drink now, I'd skip it and go to Soi Buakhao.",
      },
    ],
    articles: ["best-area-to-live-in-pattaya", "nightlife-in-pattaya", "living-in-pattaya", "pattaya-old-reputation-out-of-date"],
    askTopic: "renting",
    label: { x: 168, y: 202 },
    shape: { x: 40, y: 136, w: 210, h: 124 },
  },
  {
    id: "pratumnak",
    slug: "pratumnak",
    name: "Pratumnak",
    tagline: "The quiet hill between town and Jomtien",
    metaTitle: "Living in Pratumnak, Pattaya: Rents, Restaurants and Who It Suits (2026) | Shane Ruddle",
    description:
      "Pratumnak Hill from someone who lives there: who it suits, what ฿20,000 a month rents, the best beach nearby, where to eat and why condo owners here are happy.",
    verdict: [
      "I'm biased, because I live here. Pratumnak sits between Pattaya and Jomtien and suits people in the middle: quieter than Central, but closer to the action than Jomtien.",
      "Town is about a five-minute drive. Jomtien is just as close, since the road from Pratumnak Soi 5 now runs along Dongtan Beach, and I often head down that way for breakfast at Hemingways.",
    ],
    suits: ["Couples who want quiet without being far out", "Condo buyers thinking about long-term value", "Runners: the hill loop is always in the shade"],
    notFor: ["Tight budgets", "Anyone who wants a house", "Pet owners, as few condos allow them"],
    rent20k: "A small one-bed. Pratumnak is mostly high-rise condos.",
    calcArea: "pratumnak",
    picks: [
      { name: "Pattaya Rent a Car", note: "Our office has been in Pratumnak for years.", url: "https://www.pattayarentacar.com", mine: true },
      { name: "Gooseberries", note: "My go-to for a steak. It's owned by my friend Kenneth, a chef himself." },
      { name: "The Forest by the Sky and The Sky Gallery", note: "Up the hill towards Cosy Beach, if I want Thai food." },
      { name: "Pratumnak Hill loop", note: "A purpose-built circuit of just over a kilometre, always in the shade. I run it most days." },
      { name: "Dongtan Beach", note: "Starts at the bottom of Soi 5. Of the beaches close to the city, it's the one I'd pick." },
    ],
    faqs: [
      {
        q: "Is Pratumnak a good place to live?",
        a: "Yes, and I'm biased, because I live there. It's quieter than Central but closer to the action than Jomtien. Town and Jomtien are both about a five-minute drive.",
      },
      {
        q: "Is Pratumnak a good place to buy a condo?",
        a: "Anyone who bought in Pratumnak ten years ago is very happy now, because values there have only gone up. As anywhere, look for areas on the way up, and rent before you buy.",
      },
      {
        q: "What's the nearest beach to Pratumnak?",
        a: "Dongtan Beach. It starts at the bottom of Pratumnak Soi 5 and runs along to Jomtien Beach. Of the beaches close to the city, it's the one I'd recommend.",
      },
    ],
    articles: ["best-area-to-live-in-pattaya", "buying-a-condo-in-pattaya", "where-a-restaurant-owner-eats-in-pattaya", "staying-fit-in-pattaya", "best-beaches-in-pattaya"],
    askTopic: "buying",
    label: { x: 160, y: 302 },
    shape: { x: 40, y: 264, w: 210, h: 66 },
  },
  {
    id: "jomtien",
    slug: "jomtien",
    name: "Jomtien",
    tagline: "The beach, at a slower pace",
    metaTitle: "Living in Jomtien, Pattaya: Rents, Retiring and Who It Suits (2026) | Shane Ruddle",
    description:
      "Is Jomtien a good place to live? A 20-year Pattaya resident on why he'd start retirees here, what ฿20,000 a month rents, and why it's the area to watch.",
    verdict: [
      "I'd start a retired couple in Jomtien. It's quieter, there's less going on, and you're right by the sea. Day to day, it's the pace of life, the beach, dozens of restaurants to choose from, and plenty of like-minded people.",
      "It's also where I think most of Pattaya's growth will come over the next ten years. Jomtien Second Road completely changed the area, and there's still a lot of empty land along it.",
    ],
    suits: ["Retired couples", "Beach lovers who want more space for their money", "Buyers thinking long-term"],
    notFor: ["Anyone who wants nightlife on the doorstep", "Pet owners, as few condos allow them"],
    rent20k: "A one-bed that's a bit bigger than you'd find in Wongamat or Pratumnak, usually in an older building.",
    calcArea: "jomtien",
    picks: [
      { name: "Hemingways Jomtien", note: "My first restaurant and still the flagship: an international pub with plenty of TVs for the football.", url: "https://www.hemingwaysjomtien.com", mine: true },
      { name: "East Coast Real Estate", note: "Our rental agency's office is right next door to Hemingways.", url: ecreUrl("area_jomtien"), mine: true },
      { name: "Marco's", note: "My favourite Italian, on Thappraya Road. Don't skip the dessert trio." },
      { name: "Dongtan Beach", note: "Runs from Pratumnak along to Jomtien Beach. Nicer than Jomtien Beach itself." },
    ],
    faqs: [
      {
        q: "Is Jomtien a good place to live?",
        a: "Yes, especially if you're retired or want the beach. It's quieter than Central, you're right by the sea, and there are dozens of restaurants and plenty of like-minded people.",
      },
      {
        q: "Is Jomtien good for retirees?",
        a: "It's where I'd start a retired couple. There are lots of retired couples there, so it's easy to make friends. If it still feels too busy after a few years, the natural next step is East Pattaya.",
      },
      {
        q: "Is Jomtien a good place to invest?",
        a: "I think it's where most of Pattaya's growth will come over the next ten years. Jomtien Second Road changed the area, and there's still plenty of room left along it.",
      },
    ],
    articles: ["best-area-to-live-in-pattaya", "retiring-in-pattaya", "where-pattaya-is-heading", "running-a-restaurant-and-bar-in-pattaya", "renting-a-condo-in-pattaya"],
    askTopic: "retiring",
    label: { x: 168, y: 388 },
    shape: { x: 40, y: 334, w: 210, h: 106 },
  },
  {
    id: "najomtien",
    slug: "na-jomtien-bang-saray",
    name: "Na Jomtien & Bang Saray",
    tagline: "Further south, more room for your money",
    metaTitle: "Living in Na Jomtien & Bang Saray, Pattaya: Rents and Who It Suits (2026) | Shane Ruddle",
    description:
      "Na Jomtien and Bang Saray from a 20-year Pattaya resident: what ฿20,000 a month rents, the fishing village that feels like old Pattaya, and who should live there.",
    verdict: [
      "Head south past Jomtien and your money goes further. ฿20,000 a month gets you a bigger one-bed, though usually set back from the beach rather than on it.",
      "Bang Saray is a quaint little fishing village that reminds me of Pattaya 10 or 20 years ago. The beaches down this way are better than the ones in the city, too.",
    ],
    suits: ["People who want more space for the money", "Anyone happy to drive", "Those who'd like a slower, village feel"],
    notFor: ["People without their own transport", "Anyone who wants city life on the doorstep"],
    rent20k: "A bigger one-bed, but usually set back from the beach rather than on it.",
    picks: [
      { name: "Bang Saray", note: "A fishing village with a nice beach and plenty of seafood restaurants for lunch." },
      { name: "The Navy Beach", note: "My favourite beach, through the Navy grounds, about 30 minutes from Pattaya." },
      { name: "Pattaya Rent a Car", note: "You'll want your own wheels down here.", url: "https://www.pattayarentacar.com", mine: true },
    ],
    faqs: [
      {
        q: "Is Na Jomtien a good place to live?",
        a: "It is if you want more space for your money and don't mind driving. ฿20,000 a month gets a bigger one-bed than in town, usually set back from the beach rather than on it.",
      },
      {
        q: "What is Bang Saray like?",
        a: "A quaint little fishing village that reminds me of Pattaya 10 or 20 years ago. You can walk around, the beach is nice, and there are plenty of seafood restaurants.",
      },
      {
        q: "Do I need a car in Na Jomtien or Bang Saray?",
        a: "Realistically, yes. It's further from the city, so most people who live down here drive.",
      },
    ],
    articles: ["best-area-to-live-in-pattaya", "best-day-trips-from-pattaya", "best-beaches-in-pattaya", "scooter-or-car-in-pattaya"],
    askTopic: "renting",
    label: { x: 208, y: 498 },
    shape: { x: 40, y: 444, w: 210, h: 116 },
  },
  {
    id: "east",
    slug: "east-pattaya",
    name: "East Pattaya",
    tagline: "Houses, schools and space",
    metaTitle: "Living in East Pattaya: Family Houses, Schools and Rents (2026) | Shane Ruddle",
    description:
      "East Pattaya from a 20-year resident raising a family there: house rents with and without a pool, international schools, pets, and why you'll want a car.",
    verdict: [
      "East Pattaya is quieter and suits families and older retirees. It's mainly houses, close to most of the international schools, and if you have pets, it's usually where you'll end up; few condos on the beach side of Sukhumvit Road allow them.",
      "It's where your money goes furthest. The trade-off is that it's spread out, so most people who live there drive. If I moved again, it would probably be out here.",
    ],
    suits: ["Families with children at international school", "Pet owners", "Anyone who wants a house for their money"],
    notFor: ["People who don't want to drive", "Anyone who wants to walk to the beach"],
    rent20k: "Possibly a two- or three-bedroom house, though without a pool.",
    calcArea: "east",
    picks: [
      { name: "Hemingways Lakeside", note: "My restaurant by Mabprachan Lake, with garden seating and a family-friendly feel.", url: "https://www.hemingwayslakeside.com", mine: true },
      { name: "Mabprachan Lake", note: "A 10-kilometre loop around the lake, if you're a runner." },
      { name: "Tara Pattana International School", note: "Where my kids go. Most of the international schools are on this side of Sukhumvit." },
    ],
    faqs: [
      {
        q: "Is East Pattaya good for families?",
        a: "Yes. It's quieter, mainly houses, and close to most of the international schools. Most families in Pattaya live there, and the nightlife is barely noticeable.",
      },
      {
        q: "How much does a house cost to rent in East Pattaya?",
        a: "Roughly ฿30,000 to ฿40,000 a month without a pool and ฿40,000 to ฿50,000 with one (2026). At ฿20,000 you might get a two- or three-bedroom house without a pool.",
      },
      {
        q: "Do I need a car in East Pattaya?",
        a: "Most people who live there drive. You can manage on a motorbike, but it's spread out. Traffic is fairly light on that side, and there's still plenty to do; it's just further apart.",
      },
    ],
    articles: ["is-pattaya-good-for-families", "international-schools-in-pattaya", "buying-a-house-in-pattaya", "best-area-to-live-in-pattaya", "driving-in-pattaya"],
    askTopic: "family",
    label: { x: 330, y: 270 },
    shape: { x: 262, y: 40, w: 138, h: 440 },
  },
];

export const areaBySlug = (slug: string) => AREAS.find((a) => a.slug === slug);
export const areaById = (id: AreaId) => AREAS.find((a) => a.id === id)!;

export const AREAS_META = {
  title: "Where to Live in Pattaya: Interactive Area Map and Finder (2026) | Shane Ruddle",
  description:
    "Which part of Pattaya suits you? Answer four questions or tap the map. Jomtien, Pratumnak, Central, Wongamat, East Pattaya and Bang Saray, from a 20-year resident.",
};

export const AREAS_FAQS: AreaFaq[] = [
  {
    q: "What's the best area to live in Pattaya?",
    a: "It depends on your stage of life. Central Pattaya if you're young and want the buzz, Jomtien if you're retired and want the beach, Pratumnak for a bit of both, and East Pattaya if you have kids or pets.",
  },
  {
    q: "What does ฿20,000 a month rent in Pattaya?",
    a: "A small one-bed in Central or Pratumnak, a slightly bigger one-bed in Jomtien, possibly only a studio in Wongamat, and possibly a two- or three-bedroom house without a pool in East Pattaya (2026).",
  },
  {
    q: "Where do families live in Pattaya?",
    a: "Mostly in East Pattaya. It's mainly houses, close to most of the international schools, and it's where pet owners usually end up.",
  },
  {
    q: "What's the biggest mistake people make when choosing an area?",
    a: "Not exploring enough. Spend a whole day walking around the area you're considering to see what restaurants there are and who lives there. And rent first: most people move more than once as their life changes.",
  },
];

// ---- "Which area suits you?" matcher ----

export type QuestionId = "who" | "want" | "budget" | "extras";

export interface MatchQuestion {
  id: QuestionId;
  question: string;
  options: { id: string; label: string; reason: string }[];
}

export const MATCH_QUESTIONS: MatchQuestion[] = [
  {
    id: "who",
    question: "Who's moving?",
    options: [
      { id: "single", label: "Just me", reason: "you're on your own" },
      { id: "couple", label: "A couple", reason: "you're a couple" },
      { id: "family", label: "Family with kids", reason: "you have children" },
      { id: "retired", label: "Retired", reason: "you're retiring" },
    ],
  },
  {
    id: "want",
    question: "What matters most day to day?",
    options: [
      { id: "buzz", label: "Restaurants, bars and buzz", reason: "you want the buzz" },
      { id: "beach", label: "Being by the sea", reason: "you want the sea nearby" },
      { id: "mix", label: "A bit of both", reason: "you want a bit of both" },
      { id: "space", label: "Peace, quiet and space", reason: "you want quiet and space" },
    ],
  },
  {
    id: "budget",
    question: "Your rent budget each month?",
    options: [
      { id: "low", label: "Under ฿20,000", reason: "you want your money to go further" },
      { id: "mid", label: "฿20,000 to ฿35,000", reason: "your budget is mid-range" },
      { id: "high", label: "Over ฿35,000", reason: "you have room in the budget" },
    ],
  },
  {
    id: "extras",
    question: "Any of these?",
    options: [
      { id: "pets", label: "I'll have a pet", reason: "you'll have a pet" },
      { id: "car", label: "I'll drive a car", reason: "you'll drive" },
      { id: "none", label: "Neither", reason: "you won't drive" },
    ],
  },
];

// How well each answer fits each area, 0 to 3. Drawn from best-area-to-live-in-pattaya.
const SCORES: Record<AreaId, Record<string, number>> = {
  central: { single: 3, couple: 1, family: 0, retired: 0, buzz: 3, beach: 1, mix: 1, space: 0, low: 1, mid: 2, high: 2, pets: 0, car: 0, none: 3 },
  pratumnak: { single: 1, couple: 3, family: 1, retired: 2, buzz: 1, beach: 2, mix: 3, space: 1, low: 0, mid: 2, high: 2, pets: 0, car: 1, none: 2 },
  jomtien: { single: 1, couple: 2, family: 1, retired: 3, buzz: 1, beach: 3, mix: 2, space: 1, low: 2, mid: 2, high: 1, pets: 0, car: 1, none: 2 },
  wongamat: { single: 1, couple: 2, family: 1, retired: 1, buzz: 1, beach: 2, mix: 2, space: 0, low: 0, mid: 1, high: 3, pets: 0, car: 0, none: 2 },
  najomtien: { single: 0, couple: 2, family: 1, retired: 2, buzz: 0, beach: 2, mix: 0, space: 2, low: 2, mid: 2, high: 1, pets: 1, car: 2, none: 0 },
  east: { single: 0, couple: 1, family: 3, retired: 2, buzz: 0, beach: 0, mix: 0, space: 3, low: 3, mid: 2, high: 2, pets: 3, car: 3, none: 0 },
};

export type MatchAnswers = Partial<Record<QuestionId, string>>;

export interface MatchResult {
  area: PattayaArea;
  runnerUp: PattayaArea;
  /** Answers that point to the top area, as short phrases. */
  reasons: string[];
}

export function matchArea(answers: MatchAnswers): MatchResult {
  const ranked = AREAS.map((area, i) => ({
    area,
    i,
    score: Object.values(answers).reduce((sum, a) => sum + (a ? SCORES[area.id][a] ?? 0 : 0), 0),
  })).sort((x, y) => y.score - x.score || x.i - y.i);
  const top = ranked[0].area;
  const reasons = MATCH_QUESTIONS.flatMap((q) => {
    const opt = q.options.find((o) => o.id === answers[q.id]);
    return opt && SCORES[top.id][opt.id] >= 2 ? [opt.reason] : [];
  });
  return { area: top, runnerUp: ranked[1].area, reasons };
}

/** Plain-text summary of the answers, sent with an Ask Shane question. */
export function answersSummary(answers: MatchAnswers, result: MatchResult) {
  const lines = MATCH_QUESTIONS.map((q) => `${q.question} ${q.options.find((o) => o.id === answers[q.id])?.label ?? "-"}`);
  return `Area finder answers:\n${lines.join("\n")}\nSuggested: ${result.area.name} (runner-up ${result.runnerUp.name})`;
}
