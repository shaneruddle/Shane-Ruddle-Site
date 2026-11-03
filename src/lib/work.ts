// "Working in Pattaya" section at /work-in-pattaya: the job hunt seen from the employer's side.
// A six-question "Would I hire you?" check, a job offer checker, the jobs-and-pay table, a 90-day
// networking plan and a CV upload that emails Shane. Copy is condensed from Shane's work articles
// (finding-a-job, teaching-english, working-in-hospitality, working-as-a-property-agent,
// pattaya-for-digital-nomads, hiring-foreign-staff, managing-thai-staff, bar-manager-to-7-businesses).

export const WORK_PATH = "/work-in-pattaya";

export const WORK_META = {
  title: "Working in Pattaya as a Foreigner: Jobs, Pay, Work Permits and Who's Hiring | Shane Ruddle",
  description:
    "Jobs foreigners actually do in Pattaya, what they pay and how to get in, from an owner who hires. Check whether you're ready, test a job offer for red flags, and send me your CV.",
};

const A = {
  job: "/articles/finding-a-job-in-pattaya",
  teach: "/articles/teaching-english-in-pattaya",
  hosp: "/articles/working-in-hospitality-in-pattaya",
  agent: "/articles/working-as-a-property-agent-in-pattaya",
  nomad: "/articles/pattaya-for-digital-nomads",
  hiring: "/articles/hiring-foreign-staff-in-pattaya",
  thai: "/articles/managing-thai-staff",
};

// ---------------------------------------------------------------------------------------------
// Jobs foreigners do, and what they pay

export type RoleId = "teach" | "manage" | "chef" | "sales" | "hotel" | "dive" | "property" | "remote";

export interface Role {
  id: RoleId;
  label: string;
  short: string;
  pay: string;
  howIn: string;
  catch: string;
  href: string;
  /** Extra link shown on the result card. */
  extra?: { label: string; href: string };
  /** Pay figure not given by Shane, shown with a badge. */
  payUnverified?: boolean;
}

export const ROLES: Role[] = [
  {
    id: "teach",
    label: "Teaching",
    short: "Thai schools to top international schools",
    pay: "฿30,000–40,000 a month at the lower end, up to a few hundred thousand at the top international schools",
    howIn:
      "A TEFL certificate is the minimum, and for a work permit you'll generally need a degree too, in any subject. The top international schools also want a recognised teaching qualification and experience.",
    catch:
      "Without the right qualifications you won't get a work permit, and schools do get investigated. Teachers have their own permit rules, so the usual ฿50,000 minimum doesn't always apply.",
    href: A.teach,
    extra: { label: "Compare the international schools", href: "/international-schools-pattaya" },
  },
  {
    id: "manage",
    label: "Restaurant or bar manager",
    short: "In a small place you run everything",
    pay: "฿50,000–150,000 a month, and a profit share is the main way to grow it",
    howIn:
      "It's all networking. Get to know the owner, never walk in asking for a job, and leave your number or CV. Even if they're not hiring, they'll know someone who is.",
    catch:
      "Late finishes and a drink with the regulars are part of the job. I've lost good managers who never got out of holiday mode.",
    href: A.hosp,
  },
  {
    id: "chef",
    label: "Chef",
    short: "Good international chefs are sought after",
    pay: "Inside the usual ฿50,000–150,000 range for employed foreigners",
    payUnverified: true,
    howIn:
      "There's plenty of work. For hotels, send your CV and aim for an interview. For restaurants, it's networking: get to know the owners.",
    catch: "A great CV from home isn't enough on its own. You'll be running a Thai kitchen team, and how you speak to people matters more than anywhere I know.",
    href: A.hosp,
  },
  {
    id: "sales",
    label: "Condo sales",
    short: "Sales staff for developers, mostly commission",
    pay: "Uncapped: maybe ฿50,000 one month and ฿200,000–400,000 in a really good one",
    howIn: "Developers hire foreign sales staff to sell to their own nationalities. You earn what you put in.",
    catch: "Good months and bad months. Have savings behind you for the slow ones.",
    href: A.job,
  },
  {
    id: "hotel",
    label: "Hotel translator or marketing",
    short: "Your nationality and language are the skill",
    pay: "Inside the usual ฿50,000–150,000 range; the top Bangkok hotels can pay more",
    payUnverified: true,
    howIn:
      "Networking is very hard with the big hotels, so if you're qualified, send your CV out and aim for an interview. Hotels need people who speak to the nationalities they attract.",
    catch: "There are only so many of these roles, and they suit the languages a hotel's guests speak.",
    href: A.hosp,
  },
  {
    id: "dive",
    label: "Diving instructor",
    short: "One of the jobs I see foreigners do most",
    pay: "I haven't written pay figures for this. ฿50,000 is the work-permit minimum for many Western nationalities",
    payUnverified: true,
    howIn: "Be here, get known at the dive shops, and have your instructor qualifications ready.",
    catch: "You need a work permit like anyone else. Teaching the odd course for cash isn't legal.",
    href: A.job,
  },
  {
    id: "property",
    label: "Working in property",
    short: "Agencies hire Thai and foreign staff",
    pay: "Around ฿20,000–25,000 basic plus 25% commission. A rental agent earns ฿60,000–100,000; a good sales agent upwards of ฿150,000",
    howIn:
      "Give it three or four months to learn the areas, the buildings and the systems, and a year to earn reasonably. The best agents build their own personal brand.",
    catch: "Agent and broker work itself is reserved for Thais, so make sure the role and the paperwork are set up properly from the start.",
    href: A.agent,
  },
  {
    id: "remote",
    label: "Remote work",
    short: "Your clients or employer are abroad",
    pay: "Whatever you earn online, with a far lower cost of living than most places",
    howIn: "You don't need a Thai job. The Destination Thailand Visa is the option for remote workers. Choose your area for lifestyle; Pratumnak has a lot of remote workers.",
    catch: "The DTV is essentially a long-term tourist visa, so things like opening a bank account can be harder, depending on the bank.",
    href: A.nomad,
    extra: { label: "See the DTV", href: "/thai-visas/dtv-visa" },
  },
];

export const roleById = (id?: string) => ROLES.find((r) => r.id === id);

// ---------------------------------------------------------------------------------------------
// "Would I hire you?" check

export type WorkQuestionId = "role" | "where" | "years" | "roots" | "evenings" | "quals";
export type WorkAnswers = Partial<Record<WorkQuestionId, string>>;

export interface WorkQuestion {
  id: WorkQuestionId;
  question: string;
  hint?: string;
  options: { id: string; label: string; sub?: string }[];
}

export const WORK_QUESTIONS: WorkQuestion[] = [
  {
    id: "role",
    question: "What kind of work are you after?",
    options: [
      ...ROLES.map((r) => ({ id: r.id, label: r.label, sub: r.short })),
      { id: "unsure", label: "Not sure yet", sub: "Show me what's realistic" },
    ],
  },
  {
    id: "where",
    question: "Where are you right now?",
    options: [
      { id: "pattaya", label: "In Pattaya" },
      { id: "thailand", label: "Elsewhere in Thailand" },
      { id: "abroad", label: "Outside Thailand" },
    ],
  },
  {
    id: "years",
    question: "How long have you lived in Thailand?",
    options: [
      { id: "none", label: "I haven't moved yet" },
      { id: "under1", label: "Less than a year" },
      { id: "1to3", label: "One to three years" },
      { id: "over3", label: "More than three years" },
    ],
  },
  {
    id: "roots",
    question: "What ties you to Thailand?",
    hint: "Be honest. This is the first thing I look at.",
    options: [
      { id: "family", label: "A partner or family here", sub: "A Thai partner, children in school here" },
      { id: "home", label: "A home and a life here", sub: "But no family ties yet" },
      { id: "none", label: "Nothing yet", sub: "I'm seeing how it goes" },
    ],
  },
  {
    id: "evenings",
    question: "What does a typical evening look like for you here?",
    options: [
      { id: "sport", label: "Gym, sport or family", sub: "A healthy routine" },
      { id: "mix", label: "A mix", sub: "Some nights in, some out" },
      { id: "out", label: "Out most nights", sub: "It's Pattaya, after all" },
    ],
  },
  {
    id: "quals",
    question: "What do you bring?",
    options: [
      { id: "teaching", label: "A degree and a teaching qualification" },
      { id: "tefl", label: "A degree and a TEFL" },
      { id: "trade", label: "Real experience in this trade", sub: "Kitchens, bars, sales, hotels, diving" },
      { id: "none", label: "Mainly enthusiasm", sub: "No degree or trade experience yet" },
    ],
  },
];

export interface Point {
  id: string;
  text: string;
  href?: string;
}

export type HireLevel = "meet" | "nearly" | "notyet";

export interface WorkResult {
  score: number;
  level: HireLevel;
  headline: string;
  summary: string;
  flags: Point[];
  strengths: Point[];
  role?: Role;
}

export function assessWork(a: WorkAnswers): WorkResult {
  const flags: Point[] = [];
  const strengths: Point[] = [];
  let score = 0;
  const role = roleById(a.role);
  const remote = a.role === "remote";

  // Being here
  if (a.where === "pattaya") {
    score += 20;
    strengths.push({ id: "here", text: "You're already here. One of the first questions any employer asks is whether you're in Thailand and ready to start.", href: A.job });
  } else if (a.where === "thailand") {
    score += 14;
    strengths.push({ id: "thailand", text: "You're in Thailand, which matters. Spend time in Pattaya itself: most jobs here come through people you meet.", href: A.job });
  } else if (!remote) {
    flags.push({ id: "abroad", text: "Applying from abroad rarely gets a response. My first piece of advice is simple: be here.", href: A.job });
  }

  // Time in Thailand
  if (a.years === "over3") {
    score += 25;
    strengths.push({ id: "years", text: "More than three years here. The people who do well with me have usually been in Thailand at least three or four years.", href: A.hiring });
  } else if (a.years === "1to3") {
    score += 15;
    strengths.push({ id: "years", text: "You've been here a while and you're past the honeymoon. Another year or two and you'll tick my biggest box.", href: A.hiring });
  } else if (a.years === "under1") {
    score += 6;
    flags.push({ id: "years", text: "Under a year in. I've stopped putting much weight on experience back home: there are cultural differences you don't understand until you've lived here a while.", href: A.hiring });
  } else if (a.years === "none") {
    flags.push({ id: "years", text: "You haven't lived here yet. Employers want to know Thailand is home, not an extended holiday.", href: A.hiring });
  }

  // Roots
  if (a.roots === "family") {
    score += 20;
    strengths.push({ id: "roots", text: "Family ties here. Children in school, a Thai partner: that's the sign I look for that someone is here to stay.", href: A.hosp });
  } else if (a.roots === "home") {
    score += 12;
    strengths.push({ id: "roots", text: "You've put down roots with a home and a life here, rather than one foot on the plane.", href: A.hiring });
  } else if (a.roots === "none") {
    flags.push({ id: "roots", text: "Nothing ties you here yet. When I hire a manager, I need to know they're here to stay, so I look for some sign Thailand is home.", href: A.hosp });
  }

  // Routine
  if (a.evenings === "sport") {
    score += 20;
    strengths.push({ id: "routine", text: "A healthy routine. Sport or the gym rather than a social life built around going out is exactly what I look for.", href: A.hiring });
  } else if (a.evenings === "mix") {
    score += 12;
  } else if (a.evenings === "out") {
    flags.push({
      id: "routine",
      text: "Out most nights is the trap I see most. Plenty of people here aren't working, and I've had managers with good CVs who never got out of holiday mode and went home.",
      href: A.hiring,
    });
  }

  // Qualifications against the role
  if (a.role === "teach") {
    if (a.quals === "teaching") {
      score += 15;
      strengths.push({ id: "quals", text: "A degree and a teaching qualification. A friend of mine turned up with exactly that and had his pick of the schools. He's been at one for 20 years.", href: A.teach });
    } else if (a.quals === "tefl") {
      score += 11;
      strengths.push({ id: "quals", text: "A degree and a TEFL get you a work permit for many teaching jobs. The top international schools will want a teaching qualification too.", href: A.teach });
    } else {
      flags.push({ id: "quals", text: "Without a degree you'll struggle to get a teaching work permit, and teaching without one is a real risk: schools do get investigated. Get qualified first.", href: A.teach });
    }
  } else if (a.role === "property" && a.quals === "none") {
    score += 6;
    flags.push({ id: "quals", text: "Property is a numbers game with a lot of rejection. Without a passion for it, you won't last. Talk to agents, Thai and foreign, before you decide.", href: A.agent });
  } else if (a.quals === "trade") {
    score += 15;
    strengths.push({ id: "quals", text: "Real experience in the trade helps, as long as you also understand how things work here, starting with how you talk to Thai staff.", href: A.thai });
  } else if (a.quals === "teaching" || a.quals === "tefl") {
    score += 10;
  } else if (a.quals === "none") {
    score += 5;
  }

  if (remote) {
    score = Math.min(100, score + 15);
    strengths.push({ id: "remote", text: "Your work comes with you. You don't need a Thai employer, so the question is the right visa and the right area.", href: A.nomad });
  }

  score = Math.max(10, Math.min(100, score));
  const level: HireLevel = score >= 72 ? "meet" : score >= 48 ? "nearly" : "notyet";

  const headline = remote
    ? level === "notyet"
      ? "Come for a trial run first."
      : "Pattaya suits remote workers. Come and try it."
    : level === "meet"
      ? "I'd want to meet you."
      : level === "nearly"
        ? "Nearly there. Fix the gaps and the phone will ring."
        : "Not yet, but here's how to change that.";

  const summary = remote
    ? "I can't think of a better country than Thailand for remote workers. Get the visa right, pick your area for the lifestyle, and get out of the condo."
    : level === "meet"
      ? "You look like the kind of person who lasts here: settled, with a routine. Send me your CV. If I don't have the right role, I may well know someone who does."
      : level === "nearly"
        ? "You've got some of what I look for. The points below are what an owner like me would notice first. Send your CV anyway, and keep networking."
        : "Right now most owners here would worry you won't stay. That's fixable: be here, put down roots, build a routine and get known. Then send me your CV.";

  return { score, level, headline, summary, flags, strengths, role };
}

export function workAnswersQuery(a: WorkAnswers): string {
  const p = new URLSearchParams();
  WORK_QUESTIONS.forEach((q) => a[q.id] && p.set(q.id, a[q.id]!));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function workAnswersFromSearch(search: string): WorkAnswers {
  const p = new URLSearchParams(search);
  const out: WorkAnswers = {};
  for (const q of WORK_QUESTIONS) {
    const v = p.get(q.id);
    if (v && q.options.some((o) => o.id === v)) out[q.id] = v;
  }
  return out;
}

export function workSummary(a: WorkAnswers, r: WorkResult): string {
  const label = (id: WorkQuestionId) => WORK_QUESTIONS.find((q) => q.id === id)?.options.find((o) => o.id === a[id])?.label ?? "-";
  return [
    `Would I hire you? ${r.score}/100 (${r.headline})`,
    `Work: ${label("role")}`,
    `Now: ${label("where")}`,
    `In Thailand: ${label("years")}`,
    `Ties: ${label("roots")}`,
    `Evenings: ${label("evenings")}`,
    `Brings: ${label("quals")}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------------------------
// Job offer checker

export type OfferKind = "salary" | "commission" | "teacher" | "agent";
export type PermitAnswer = "employer" | "me" | "none" | "unsure";

export interface OfferInput {
  kind: OfferKind;
  pay: number; // monthly base in baht
  permit: PermitAnswer;
}

export interface OfferFlag {
  tone: "good" | "warn" | "bad";
  text: string;
  href?: string;
}

export const MIN_SALARY = 50_000;

export function checkOffer({ kind, pay, permit }: OfferInput): OfferFlag[] {
  const out: OfferFlag[] = [];

  if (kind === "agent") {
    out.push({
      tone: "bad",
      text: "Agent and broker work, showing and selling property, is reserved for Thais. Foreigners can work in property companies, but the role and the work permit have to match what you actually do.",
      href: A.agent,
    });
  }

  if (permit === "none") {
    out.push({
      tone: "bad",
      text:
        kind === "teacher"
          ? "Don't take it. You might assume helping Thai children makes you exempt from needing a permit, but you're not, and schools do get investigated."
          : "Don't take it. Any foreigner working in Thailand needs a work permit, and you're the one at risk if you're caught without one.",
      href: kind === "teacher" ? A.teach : A.agent,
    });
  } else if (permit === "unsure") {
    out.push({ tone: "warn", text: "Ask now, before you start. A proper employer will sort out your work permit. Every company has its own rules on who pays for what.", href: A.job });
  } else if (permit === "me") {
    out.push({
      tone: "warn",
      text: "Some employers charge for the permit because there's an upfront fee, so this isn't unusual. In my companies we pay for the work permit; the visa is the employee's responsibility. Ask exactly what's covered.",
      href: A.job,
    });
  } else {
    out.push({ tone: "good", text: "They'll handle the work permit. Check who keeps your visa going: in my companies that's the employee's job.", href: A.job });
  }

  if (!pay || pay <= 0) return out;
  const baht = `฿${pay.toLocaleString("en-GB")}`;

  if (kind === "salary") {
    if (pay < MIN_SALARY) {
      out.push({
        tone: "warn",
        text: `${baht} is under ฿50,000, the minimum salary on a work permit for many Western nationalities. It's lower for some nationalities and for people married to a Thai, so check what applies to you before you accept.`,
        href: A.job,
      });
    } else if (pay <= 150_000) {
      out.push({ tone: "good", text: `${baht} is in the range I'd expect for an employed foreigner here: ฿50,000 to ฿150,000.`, href: A.job });
    } else {
      out.push({ tone: "good", text: `${baht} is more than almost anyone I know in Pattaya earns. Brilliant if it's real, so make sure it's in the contract.`, href: A.job });
    }
  } else if (kind === "teacher") {
    if (pay < 30_000) {
      out.push({ tone: "warn", text: `${baht} is under the ฿30,000–40,000 I'd expect even at the lower end. Ask why, and check the work permit is part of the deal.`, href: A.teach });
    } else if (pay <= 60_000) {
      out.push({ tone: "good", text: `${baht} is normal for Thai schools. Teachers have their own permit rules, so the usual ฿50,000 minimum doesn't always apply.`, href: A.teach });
    } else {
      out.push({ tone: "good", text: `${baht} is international-school territory. The top schools pay a few hundred thousand a month to qualified, experienced teachers.`, href: A.teach });
    }
  } else if (kind === "commission" || kind === "agent") {
    if (pay < 20_000) {
      out.push({ tone: "warn", text: `A ${baht} base is under the ฿20,000–25,000 we pay agents. Lower bases can work in sales, but have savings to see you through.`, href: A.agent });
    } else {
      out.push({ tone: "good", text: `A ${baht} base is in line with what we pay: around ฿20,000–25,000, with 25% commission on deals on top.`, href: A.agent });
    }
    out.push({
      tone: "warn",
      text: "Budget for the ramp-up. It takes three or four months to learn the areas and the systems, and over the following year you'll start earning reasonably. Most who quit early can't handle the rejection.",
      href: A.agent,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// What I look for (the employer's side)

export const LOOK_FOR: { id: string; title: string; body: string; href: string }[] = [
  { id: "here", title: "You're here", body: "Applications from abroad rarely get a reply. Be here, and be in a position to start.", href: A.job },
  { id: "settled", title: "You've settled", body: "The people who do well with me have usually been in Thailand three or four years, with a partner, family or a home here.", href: A.hiring },
  { id: "routine", title: "You've a routine", body: "Hobbies like sport or the gym rather than a social life that revolves around going out. Holiday mode is what sinks most hires.", href: A.hiring },
  { id: "likeable", title: "You're likeable", body: "I'd take confident, friendly and kind over overqualified. If I find you approachable, most of our customers will too.", href: A.hosp },
  { id: "face", title: "You get face", body: "Never tell someone off in front of their colleagues. Take them aside, quietly. A manager who doesn't understand that loses the whole team.", href: A.thai },
  { id: "recommended", title: "Someone vouches for you", body: "Most hiring in Pattaya happens through recommendations, because taking on someone nobody knows is a minefield.", href: A.hiring },
];

// ---------------------------------------------------------------------------------------------
// 90-day networking plan

export const PLAN: { id: string; when: string; title: string; body: string }[] = [
  { id: "arrive", when: "Week 1", title: "Be here, and make a list", body: "Write down the places you'd genuinely like to work: restaurants, bars, hotels, schools, agencies. Aim for a long list." },
  { id: "customer", when: "Weeks 1–4", title: "Become a customer, not an applicant", body: "Go in, eat, have a drink. Find out who the owner is. Don't ask if they've got any jobs." },
  { id: "ear", when: "Weeks 2–6", title: "Get in their ear, subtly", body: "Compliment the food, whatever it might be. Sooner or later they'll ask what you do. Say you're looking for a position at the moment." },
  { id: "leave", when: "Every visit", title: "Leave something behind", body: "Your number on a piece of paper or a copy of your CV. Even if they're not hiring, they'll know someone who is." },
  { id: "next", when: "Weeks 2–10", title: "Move on to the next place, and keep going", body: "One place at a time, down your list. It's a numbers game, the same as sales." },
  { id: "hotels", when: "Any time", title: "Send your CV to the big hotels", body: "Networking is very hard with the big hotels. If you're qualified, send your CV and aim for an interview." },
  { id: "routine", when: "From day one", title: "Build a routine people notice", body: "Gym, sport, early mornings. Owners talk to each other, and they notice who's out every night." },
  { id: "shane", when: "Now", title: "Send me your CV", body: "After 20 years here I know a lot of business owners who are often hiring. If I don't have the right role, I may know someone who does." },
];

export const PLAN_STORAGE_KEY = "work-plan-v1";

// ---------------------------------------------------------------------------------------------
// FAQ (rendered on the page and as FAQPage schema)

export const WORK_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "Can a foreigner get a job in Pattaya?",
    a: "Yes, but it's difficult. Many occupations are reserved for Thai nationals. Be here: applying from abroad rarely gets a response.",
    href: A.job,
  },
  {
    q: "What jobs do foreigners do in Pattaya?",
    a: "The ones I see most are diving instructors, teachers, restaurant and bar managers, chefs, condo sales staff, hotel translators and marketing, and roles in property companies.",
    href: A.job,
  },
  {
    q: "How much can a foreigner earn in Pattaya?",
    a: "If you're employed, expect ฿50,000 to ฿150,000 a month. I don't know many people in Pattaya earning more. Commission-based sales can pay ฿200,000 to ฿400,000 in a really good month.",
    href: A.job,
  },
  {
    q: "Do I need a work permit?",
    a: "Yes. A proper employer will sort it out, though some charge for it. The visa is often your responsibility. You can work on a marriage visa, as long as you have a work permit too.",
    href: A.job,
  },
  {
    q: "Can I teach English in Pattaya without a degree?",
    a: "A TEFL certificate is the minimum, and for a work permit you'll generally need a degree as well. It doesn't have to be in teaching.",
    href: A.teach,
  },
  {
    q: "Can foreigners work as property agents in Thailand?",
    a: "Agent and broker work is reserved for Thais. Foreigners do work in property companies, but the role and the paperwork must be set up properly.",
    href: A.agent,
  },
  {
    q: "What's the best way to find a job in Pattaya?",
    a: "Networking, by far. Get to know owners as a customer, mention you're looking, and leave your number. Do that for a few months and the phone will ring.",
    href: A.job,
  },
  {
    q: "Is there a job centre in Pattaya?",
    a: "Pattaya Job Centre, which I started over 20 years ago and handed over long since, is still going. It's mainly for Thai nationals, so as a foreigner your best route is networking.",
    href: "/articles/bar-manager-to-7-businesses",
  },
];

// ---------------------------------------------------------------------------------------------
// CV upload

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_TYPES = [".pdf", ".doc", ".docx"];

export const YEARS_OPTIONS = WORK_QUESTIONS.find((q) => q.id === "years")!.options;
export const WHERE_OPTIONS = WORK_QUESTIONS.find((q) => q.id === "where")!.options;
