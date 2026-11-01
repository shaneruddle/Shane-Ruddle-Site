// International schools around Pattaya: the /international-schools-pattaya hub (school chooser +
// comparison) and one page per school. Shane's takes come from the article
// international-schools-in-pattaya. Fees are each school's published 2026/27 annual tuition
// (collected 1 Nov 2026 from published schedules); school-run times are Claude's estimates.
// Keep FEES_AS_OF and the figures in step when schools publish new schedules.

import type { AreaId } from "./areas";

export const SCHOOLS_PATH = "/international-schools-pattaya";
export const FEES_AS_OF = "2026/27";

/** Articles that show the school chooser card above Ask Shane. */
export const SCHOOL_PROMO_ARTICLES = new Set([
  "international-schools-in-pattaya",
  "is-pattaya-good-for-families",
  "best-area-to-live-in-pattaya",
  "is-pattaya-expensive",
]);

export type SchoolId = "rugby" | "regents" | "standrews" | "tara" | "highgate" | "ise" | "lovell" | "hastin";
export type Curriculum = "british" | "ib" | "american";

export interface SchoolFaq {
  q: string;
  a: string;
}

export interface School {
  id: SchoolId;
  slug: string;
  name: string;
  short: string;
  tagline: string;
  metaTitle: string;
  description: string;
  curricula: Curriculum[];
  curriculumLabel: string;
  ages: [number, number];
  agesLabel: string;
  boarding: boolean;
  /** Published annual tuition in baht, youngest to oldest year group. null = not published. */
  fees: [number, number] | null;
  /** One-off and extra costs worth knowing. */
  feeNotes: string;
  location: string;
  /** Estimated one-way school run in minutes, outside rush hour, from each area. */
  minutes: Record<AreaId, number>;
  /** Shane has written about it from experience. */
  fromShane: boolean;
  take?: string;
  intro: string[];
  standouts: string[];
  /** Official website, only where we're sure of the address. */
  website?: string;
}

export const SCHOOLS: School[] = [
  {
    id: "tara",
    slug: "tara-pattana-international-school",
    name: "Tara Pattana International School",
    short: "Tara Pattana",
    tagline: "The closest to town, and more reasonably priced. My kids go here.",
    metaTitle: "Tara Pattana International School Fees 2026/27 and a Parent's Review | Shane Ruddle",
    description:
      "Tara Pattana International School, Pattaya: 2026/27 fees, curriculum, ages and school-run times, from a parent whose children go there.",
    curricula: ["british"],
    curriculumLabel: "British",
    ages: [2, 18],
    agesLabel: "2 to 18",
    boarding: false,
    fees: [263550, 605850],
    feeNotes: "Small one-off application fee. Sibling discounts on tuition.",
    location: "East Pattaya, the closest of the big schools to the city centre",
    minutes: { wongamat: 25, central: 20, pratumnak: 25, jomtien: 25, najomtien: 30, east: 10 },
    fromShane: true,
    take:
      "We chose Tara Pattana mainly on location. Logistics probably isn't the best reason to choose a school, but at primary age I didn't think it made much difference to go to the very best one. It's also more reasonably priced, in my opinion.",
    intro: [
      "Tara Pattana is where my own children go. It's in East Pattaya, a little closer to the city centre than the other big international schools, which is why we chose it.",
    ],
    standouts: ["The shortest school run from town of all the big schools", "One of the more affordable British-curriculum options", "My kids go here, so ask me anything about it"],
  },
  {
    id: "rugby",
    slug: "rugby-school-thailand",
    name: "Rugby School Thailand",
    short: "Rugby",
    tagline: "First-class facilities and the top fees to match.",
    metaTitle: "Rugby School Thailand Fees 2026/27 and a Pattaya Parent's View | Shane Ruddle",
    description:
      "Rugby School Thailand fees for 2026/27, curriculum, boarding, facilities and school-run times from each area of Pattaya, from a Pattaya parent.",
    curricula: ["british"],
    curriculumLabel: "British (IGCSE, A Level)",
    ages: [2, 18],
    agesLabel: "2 to 18",
    boarding: true,
    fees: [552000, 1445300],
    feeNotes: "Application fee and refundable deposit on top. Lunch is included. Boarding is extra.",
    location: "Near Khao Mai Kaew, between Highways 36 and 331, about 5 minutes from Mabprachan Lake",
    minutes: { wongamat: 35, central: 30, pratumnak: 35, jomtien: 30, najomtien: 30, east: 20 },
    fromShane: true,
    take:
      "The facilities are first class, including a 50-metre competition swimming pool. I've done 10K runs around the school, and they've recently built a golf driving range for their golf academy. My kids did a football camp there over the summer holidays and loved it.",
    intro: [
      "Rugby School Thailand is the Thai sister school of Rugby School in England, on a big campus east of Pattaya. If you're paying for the top end, this is usually the one people mean.",
    ],
    standouts: ["50-metre competition pool and a golf academy", "Day and boarding", "The most expensive school here, over ฿1 million a year for older children"],
    website: "https://www.rugbyschool.ac.th/admissions/fees",
  },
  {
    id: "regents",
    slug: "regents-international-school-pattaya",
    name: "Regents International School Pattaya",
    short: "Regents",
    tagline: "One of the longest-established, with the IB Diploma.",
    metaTitle: "Regents International School Pattaya Fees 2026/27 and Review | Shane Ruddle",
    description:
      "Regents International School Pattaya: 2026/27 fees, British and IB curriculum, boarding and school-run times from each area, from a Pattaya parent.",
    curricula: ["british", "ib"],
    curriculumLabel: "British, then IB Diploma",
    ages: [2, 18],
    agesLabel: "2 to 18",
    boarding: true,
    fees: [436050, 829350],
    feeNotes: "Application and enrolment fees on top. Sibling discounts (5% for a second child, 10% for a third). Boarding is extra.",
    location: "Pong, out on Highway 36",
    minutes: { wongamat: 30, central: 25, pratumnak: 30, jomtien: 30, najomtien: 35, east: 15 },
    fromShane: true,
    take: "One of the older international schools in Pattaya, out on Highway 36, quite a long way from the city. A very good school.",
    intro: [
      "Regents is part of the Nord Anglia group and one of the longest-established international schools around Pattaya. Older students can take the IB Diploma.",
    ],
    standouts: ["IB Diploma in the final two years", "Day and boarding", "Long track record in Pattaya"],
    website: "https://www.nordangliaeducation.com/risp-pattaya/admissions/tuition-fees",
  },
  {
    id: "highgate",
    slug: "highgate-international-school-thailand",
    name: "Highgate International School Thailand",
    short: "Highgate",
    tagline: "Brand new in August 2026, with a Man City Football School.",
    metaTitle: "Highgate International School Thailand (Pattaya) Fees 2026/27 | Shane Ruddle",
    description:
      "Highgate International School Thailand, the new school near Pattaya that opened in August 2026: fees, curriculum, ages and school-run times.",
    curricula: ["british"],
    curriculumLabel: "British",
    ages: [2, 18],
    agesLabel: "2 to 18 (growing year by year)",
    boarding: false,
    fees: [375000, 795000],
    feeNotes: "One-off enrolment fee of about ฿200,000 and a ฿100,000 refundable deposit. Merit scholarships offered.",
    location: "Near Siam Country Club, east of Pattaya",
    minutes: { wongamat: 30, central: 25, pratumnak: 30, jomtien: 30, najomtien: 35, east: 15 },
    fromShane: true,
    take:
      "Brand new, opened in August 2026. I don't know much about it yet, though I know some of the teachers there. It runs a Man City Football School in partnership with Manchester City, which I think is a really nice touch.",
    intro: [
      "Highgate International School Thailand is the first overseas campus of Highgate School in London. It opened near Siam Country Club in August 2026.",
    ],
    standouts: ["Man City Football School on site", "Brand-new campus", "Big one-off enrolment fee, so budget for it"],
  },
  {
    id: "ise",
    slug: "international-school-eastern-seaboard",
    name: "International School Eastern Seaboard (ISE)",
    short: "ISE",
    tagline: "The American and IB option, north-east of Pattaya.",
    metaTitle: "International School Eastern Seaboard (ISE) Fees 2026/27 | Shane Ruddle",
    description:
      "International School Eastern Seaboard (ISE) near Pattaya: 2026/27 fees, American and IB curriculum, ages and school-run times from each area.",
    curricula: ["american", "ib"],
    curriculumLabel: "American and IB",
    ages: [3, 18],
    agesLabel: "3 to 18",
    boarding: false,
    fees: [357600, 646000],
    feeNotes: "One-off entrance fee of ฿90,000 for new students, plus an application fee. 10% off for a fourth child.",
    location: "Near Burapha Golf, towards Sriracha",
    minutes: { wongamat: 30, central: 35, pratumnak: 40, jomtien: 40, najomtien: 45, east: 25 },
    fromShane: false,
    intro: [
      "ISE is the main American-style international school near Pattaya, with the IB as well. It's a smaller school north-east of the city, towards Sriracha, so it also draws families from the Eastern Seaboard industrial estates.",
    ],
    standouts: ["American curriculum and the IB", "Smaller school", "Easier from North Pattaya and Sriracha than from Jomtien"],
    website: "https://www.ise.ac.th",
  },
  {
    id: "standrews",
    slug: "st-andrews-international-school-green-valley",
    name: "St Andrews International School Green Valley",
    short: "St Andrews",
    tagline: "A family feel, but over an hour on the school run.",
    metaTitle: "St Andrews International School Green Valley Fees 2026/27 | Shane Ruddle",
    description:
      "St Andrews International School Green Valley (Rayong): 2026/27 fees, British and IB curriculum, Dutch section, and how long the school run is from Pattaya.",
    curricula: ["british", "ib"],
    curriculumLabel: "British, then IB Diploma (plus a Dutch section)",
    ages: [2, 18],
    agesLabel: "2 to 18",
    boarding: false,
    fees: [206700, 842000],
    feeNotes: "Application fee and a general deposit on top. Transport is charged per term.",
    location: "Green Valley, Ban Chang (Rayong), a long way south-east of Pattaya",
    minutes: { wongamat: 70, central: 60, pratumnak: 55, jomtien: 50, najomtien: 40, east: 50 },
    fromShane: true,
    take: "A lot further out. You're probably looking at over an hour on the school run back. From what I understand, it has more of a family feel.",
    intro: [
      "St Andrews Green Valley is in Rayong province, well south-east of Pattaya. It's part of the Nord Anglia group and has a Dutch section as well as the British and IB programmes.",
    ],
    standouts: ["More of a family feel", "IB Diploma and a Dutch section", "Over an hour on the school run from most of Pattaya"],
  },
  {
    id: "lovell",
    slug: "lovell-international-school",
    name: "Lovell International School",
    short: "Lovell",
    tagline: "A smaller school east of the city.",
    metaTitle: "Lovell International School Pattaya Fees 2026/27 | Shane Ruddle",
    description: "Lovell International School, Pattaya: 2026/27 fees, curriculum, ages and school-run times from each area of Pattaya.",
    curricula: ["british"],
    curriculumLabel: "British",
    ages: [2, 18],
    agesLabel: "2 to 18",
    boarding: false,
    fees: [340500, 560500],
    feeNotes: "Application fee on top. Fees vary by year group and programme.",
    location: "East Pattaya",
    minutes: { wongamat: 25, central: 20, pratumnak: 25, jomtien: 25, najomtien: 30, east: 10 },
    fromShane: false,
    intro: ["Lovell is one of Pattaya's smaller international schools, east of the city, and cheaper than the big names."],
    standouts: ["Smaller classes and a smaller school", "Cheaper than the big names", "Short school run from East Pattaya"],
  },
  {
    id: "hastin",
    slug: "hastin-international-school",
    name: "Hastin International School",
    short: "Hastin",
    tagline: "A small British school for younger children.",
    metaTitle: "Hastin International School Pattaya: Fees, Ages and Curriculum | Shane Ruddle",
    description: "Hastin International School, Pattaya: curriculum, ages (2 to 14), fees and school-run times from each area of Pattaya.",
    curricula: ["british"],
    curriculumLabel: "British (EYFS and primary)",
    ages: [2, 14],
    agesLabel: "2 to 14",
    boarding: false,
    fees: null,
    feeNotes: "Hastin doesn't publish its fees, so ask the school for its current schedule.",
    location: "East Pattaya",
    minutes: { wongamat: 25, central: 20, pratumnak: 25, jomtien: 25, najomtien: 30, east: 10 },
    fromShane: false,
    intro: ["Hastin is a small British-curriculum school in East Pattaya for children up to 14, so you'll need to move schools for the final years."],
    standouts: ["Small school for younger children", "Ages 2 to 14 only", "Fees not published"],
  },
];

export const schoolBySlug = (slug: string) => SCHOOLS.find((s) => s.slug === slug);

export const SCHOOLS_META = {
  title: "International Schools in Pattaya: Fees 2026/27 Compared + School Chooser | Shane Ruddle",
  description:
    "Every international school around Pattaya compared: 2026/27 fees, curriculum, ages and the school run from your area. Answer four questions for a shortlist, from a Pattaya parent.",
};

export const SCHOOLS_FAQS: SchoolFaq[] = [
  {
    q: "How much do international schools in Pattaya cost?",
    a: "Published 2026/27 tuition runs from about ฿200,000 a year for the youngest children at the cheaper schools to over ฿1.4 million for older children at Rugby. As a parent, I'd budget ฿30,000 to ฿100,000 a month per child, and remember you pay term by term, so the bills come in big chunks.",
  },
  {
    q: "What's the best international school in Pattaya?",
    a: "Rugby School Thailand is arguably the best, with first-class facilities. But the right school depends on your child's age, the curriculum you want, your budget and where you'll live. I chose Tara Pattana for my own kids, mainly on location.",
  },
  {
    q: "Where should I live for the international schools?",
    a: "East Pattaya. Most of the schools are on that side of town, it's mainly houses and villas, and much of what kids do is there. From Jomtien or Central, expect 25 to 35 minutes each way outside rush hour, and longer in high season.",
  },
  {
    q: "Are there American or IB schools in Pattaya?",
    a: "Yes. ISE (International School Eastern Seaboard) teaches an American curriculum and the IB. Regents and St Andrews Green Valley follow the British curriculum and then offer the IB Diploma for the final two years.",
  },
  {
    q: "What extra costs should I budget for?",
    a: "One-off application, enrolment and deposit fees (Highgate's enrolment fee is about ฿200,000), plus uniforms, trips, the school bus and boarding if you need it. Check each school's current fee schedule before you commit.",
  },
];

// ---- School chooser ----

export type SchoolQuestionId = "age" | "curriculum" | "budget" | "area" | "priority";
export type SchoolAnswers = Partial<Record<SchoolQuestionId, string>>;

export interface SchoolQuestion {
  id: SchoolQuestionId;
  question: string;
  hint?: string;
  options: { id: string; label: string }[];
}

export const SCHOOL_QUESTIONS: SchoolQuestion[] = [
  {
    id: "age",
    question: "How old is your child?",
    hint: "If you have more than one, pick the oldest.",
    options: [
      { id: "early", label: "2 to 5" },
      { id: "primary", label: "5 to 11" },
      { id: "secondary", label: "11 to 16" },
      { id: "sixth", label: "16 to 18" },
    ],
  },
  {
    id: "curriculum",
    question: "Which curriculum do you want?",
    options: [
      { id: "british", label: "British (IGCSE, A Level)" },
      { id: "ib", label: "IB" },
      { id: "american", label: "American" },
      { id: "any", label: "Not fussed" },
    ],
  },
  {
    id: "budget",
    question: "What's your budget per child, per year?",
    hint: "Tuition only. ฿400,000 a year is about ฿33,000 a month.",
    options: [
      { id: "low", label: "Under ฿400,000" },
      { id: "mid", label: "฿400,000 to ฿650,000" },
      { id: "high", label: "Over ฿650,000" },
      { id: "open", label: "Not sure yet" },
    ],
  },
  {
    id: "area",
    question: "Where will you live?",
    hint: "The school run matters more than people think.",
    options: [
      { id: "east", label: "East Pattaya" },
      { id: "jomtien", label: "Jomtien or Pratumnak" },
      { id: "central", label: "Central, Wongamat or Naklua" },
      { id: "najomtien", label: "Na Jomtien or Bang Saray" },
      { id: "unsure", label: "Not sure yet" },
    ],
  },
  {
    id: "priority",
    question: "What matters most?",
    options: [
      { id: "facilities", label: "Sport and facilities" },
      { id: "academic", label: "Exam results and university" },
      { id: "feel", label: "A smaller, family feel" },
      { id: "run", label: "A short school run" },
    ],
  },
];

/** Where the youngest-to-oldest fee range sits for each age answer. */
const AGE_POINT: Record<string, { f: number; age: number; label: string }> = {
  early: { f: 0.1, age: 4, label: "for a 2 to 5 year old" },
  primary: { f: 0.4, age: 8, label: "for a primary-age child" },
  secondary: { f: 0.75, age: 13, label: "for a secondary-age child" },
  sixth: { f: 1, age: 17, label: "for a 16 to 18 year old" },
};

const BUDGET_MAX: Record<string, number> = { low: 400000, mid: 650000, high: Infinity };

/** Rough tuition for a child of this age: interpolated between the youngest and oldest year groups. */
export function feeForAge(s: School, age?: string): number | null {
  if (!s.fees) return null;
  const f = AGE_POINT[age ?? ""]?.f ?? 0;
  return Math.round((s.fees[0] + (s.fees[1] - s.fees[0]) * f) / 5000) * 5000;
}

const areaFor = (a?: string): AreaId | null => (a === "east" || a === "jomtien" || a === "central" || a === "najomtien" ? a : null);

export interface SchoolMatch {
  school: School;
  score: number;
  reasons: string[];
  minutes: number | null;
  fee: number | null;
}

const PRIORITY_BONUS: Record<string, Partial<Record<SchoolId, number>>> = {
  facilities: { rugby: 4, regents: 2, highgate: 2, standrews: 1 },
  academic: { rugby: 3, regents: 3, standrews: 2, ise: 2 },
  feel: { standrews: 3, tara: 2, lovell: 3, hastin: 3, ise: 2 },
  run: {},
};

const PRIORITY_REASON: Record<string, string> = {
  facilities: "the facilities are a strength",
  academic: "it has a strong academic track record",
  feel: "it has a smaller, family feel",
};

export function matchSchools(a: SchoolAnswers): SchoolMatch[] {
  const age = AGE_POINT[a.age ?? ""]?.age ?? 8;
  const area = areaFor(a.area);
  const out: SchoolMatch[] = [];

  for (const s of SCHOOLS) {
    if (age < s.ages[0] || age > s.ages[1]) continue;
    let score = 0;
    const reasons: string[] = [];

    if (a.curriculum && a.curriculum !== "any") {
      if (s.curricula.includes(a.curriculum as Curriculum)) {
        score += 4;
        reasons.push(`it teaches the ${a.curriculum === "ib" ? "IB" : a.curriculum === "american" ? "American curriculum" : "British curriculum"}`);
      } else score -= 4;
    }

    const fee = feeForAge(s, a.age);
    const max = BUDGET_MAX[a.budget ?? ""];
    if (max && fee !== null) {
      if (fee <= max) {
        score += 3;
        reasons.push("it's within your budget");
      } else if (fee <= max * 1.15) score += 0;
      else score -= 3;
    }

    const minutes = area ? s.minutes[area] : null;
    if (minutes !== null) {
      const weight = a.priority === "run" ? 2 : 1;
      const pts = minutes <= 15 ? 3 : minutes <= 25 ? 2 : minutes <= 35 ? 1 : minutes <= 45 ? 0 : -3;
      score += pts * weight;
      if (pts >= 2) reasons.push(`it's about ${minutes} minutes from where you'll live`);
    }

    const bonus = PRIORITY_BONUS[a.priority ?? ""]?.[s.id] ?? 0;
    if (bonus) {
      score += bonus;
      reasons.push(PRIORITY_REASON[a.priority!]);
    }

    out.push({ school: s, score, reasons, minutes, fee });
  }

  // Ties go to the cheaper school.
  return out.sort((x, y) => y.score - x.score || (x.fee ?? Infinity) - (y.fee ?? Infinity));
}

export const baht = (n: number) => `฿${n.toLocaleString("en-GB")}`;
export const bahtShort = (n: number) => (n >= 1000000 ? `฿${(n / 1000000).toFixed(2).replace(/0$/, "")}m` : `฿${Math.round(n / 1000)}k`);
export const feeRange = (s: School) => (s.fees ? `${bahtShort(s.fees[0])} to ${bahtShort(s.fees[1])}` : "Not published");
export const feeRangeMonthly = (s: School) =>
  s.fees ? `about ${bahtShort(s.fees[0] / 12)} to ${bahtShort(s.fees[1] / 12)} a month` : "Ask the school";

export const ageLabel = (age?: string) => AGE_POINT[age ?? ""]?.label ?? "";

export function schoolAnswersSummary(a: SchoolAnswers, matches: SchoolMatch[]): string {
  const lines = SCHOOL_QUESTIONS.filter((q) => a[q.id]).map((q) => `${q.question} ${q.options.find((o) => o.id === a[q.id])?.label}`);
  const list = matches.slice(0, 3).map((m, i) => `${i + 1}. ${m.school.name}${m.fee ? ` (~${baht(m.fee)}/yr)` : ""}${m.minutes ? `, ~${m.minutes} min` : ""}`);
  return `School chooser answers:\n${lines.join("\n")}\n\nMy shortlist:\n${list.join("\n")}`;
}

export function faqsForSchool(s: School): SchoolFaq[] {
  const nearest = (Object.entries(s.minutes) as [AreaId, number][]).sort((x, y) => x[1] - y[1])[0];
  return [
    {
      q: `How much does ${s.short} cost?`,
      a: s.fees
        ? `Published ${FEES_AS_OF} tuition at ${s.name} runs from ${baht(s.fees[0])} a year for the youngest children to ${baht(s.fees[1])} for the oldest, ${feeRangeMonthly(s)}. ${s.feeNotes}`
        : s.feeNotes,
    },
    {
      q: `What curriculum does ${s.short} teach, and for what ages?`,
      a: `${s.curriculumLabel}, for ages ${s.agesLabel}.${s.boarding ? " It offers boarding as well as day places." : ""}`,
    },
    {
      q: `How far is ${s.short} from Pattaya?`,
      a: `${s.location}. Outside rush hour, I'd allow about ${s.minutes.central} minutes from Central Pattaya, ${s.minutes.jomtien} from Jomtien and ${nearest[1]} from ${nearest[0] === "east" ? "East Pattaya" : "the closest area"}. Add more in high season.`,
    },
  ];
}
