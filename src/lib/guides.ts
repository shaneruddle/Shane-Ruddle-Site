// "Start here" guides: one hub page per reader goal at /guides/<slug>. Each hub gives short
// answers (also published as FAQPage structured data) and groups the existing articles into
// chapters, so readers get a route through the site and every article gets a link from its hub.
//
// Answers are condensed from the linked articles; keep them in step if an article changes.
// An article's "home" guide (shown at the top of the article) is the first guide that lists it
// in a chapter without `related: true`.

import type { AskTopic } from "../components/AskShane";
import { PAGE_META } from "../seo";

export interface GuideFaq {
  q: string;
  a: string;
  /** Article that answers this in full. */
  slug: string;
}

export interface GuideChapter {
  title: string;
  blurb: string;
  slugs: string[];
  /** Cross-links to articles whose home is another guide. */
  related?: boolean;
}

export interface Guide {
  slug: string;
  /** Short name for tiles and links. */
  name: string;
  /** Homepage tile prompt: "I'm …" */
  planning: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  askTopic?: AskTopic;
  faqs: GuideFaq[];
  chapters: GuideChapter[];
}

export const GUIDES: Guide[] = [
  {
    slug: "moving-to-pattaya",
    name: "Moving to Pattaya",
    planning: "Moving to Pattaya",
    title: "Moving to Pattaya: my guide after 20 years here",
    metaTitle: "Moving to Pattaya: The Complete Guide From a 20-Year Resident | Shane Ruddle",
    description:
      "Costs, the best areas, visas, healthcare, banking and getting around. Everything I'd tell a friend moving to Pattaya, from 20 years of living here.",
    intro:
      "I came to Pattaya over 20 years ago and never left. This is everything I'd tell a friend who was thinking of making the move, in the order I'd tell it.",
    faqs: [
      {
        q: "What's it really like living in Pattaya?",
        a: "Slower, sunnier and friendlier than life in the West. As of 2026, a single person can live comfortably on about ฿50,000 to ฿60,000 a month.",
        slug: "living-in-pattaya",
      },
      {
        q: "How much does it cost to live in Pattaya?",
        a: "For a single person in a one-bed condo, roughly ฿50,000 to ฿55,000 a month, eating out every day: around ฿18,000 rent, ฿30,000 food and a few thousand to get around.",
        slug: "is-pattaya-expensive",
      },
      {
        q: "What's the best area to live in Pattaya?",
        a: "It depends on your stage of life. Central Pattaya if you're young and want the buzz, Jomtien if you're retired and want the beach, Pratumnak for a bit of both, and East Pattaya if you have kids or pets.",
        slug: "best-area-to-live-in-pattaya",
      },
      {
        q: "Is Pattaya safe?",
        a: "Day to day, I feel extremely safe here, and I'm raising a family here. The biggest danger isn't crime. It's the roads.",
        slug: "is-pattaya-safe",
      },
      {
        q: "Which visa do I need to retire in Pattaya?",
        a: "A retirement visa, the Non-Immigrant O or the O-A. You need to be 50 or over and show ฿800,000 in a Thai bank account, an income of ฿65,000 a month, or a combination (as of October 2026).",
        slug: "thai-visas-in-pattaya",
      },
      {
        q: "Do I need health insurance in Thailand?",
        a: "Yes. The private hospitals are first class, and a standard visit is around ฿2,000 to ฿3,000, but my main advice is simple: get health insurance.",
        slug: "healthcare-in-pattaya",
      },
    ],
    chapters: [
      {
        title: "Is Pattaya right for you?",
        blurb: "What life here is really like, and how it compares with the alternatives.",
        slugs: [
          "living-in-pattaya",
          "pattaya-old-reputation-out-of-date",
          "what-i-wish-id-known-before-moving-to-thailand",
          "pattaya-vs-phuket",
          "pattaya-vs-hua-hin",
          "pattaya-vs-bangkok",
          "where-pattaya-is-heading",
          "if-i-were-mayor-of-pattaya",
        ],
      },
      {
        title: "Where to live and what it costs",
        blurb: "Choosing an area, setting a budget and finding a place to rent.",
        slugs: ["best-area-to-live-in-pattaya", "is-pattaya-expensive", "renting-a-condo-in-pattaya"],
      },
      {
        title: "Visas, money and healthcare",
        blurb: "The paperwork and practicalities to sort out first.",
        slugs: ["thai-visas-in-pattaya", "banking-in-thailand-for-foreigners", "healthcare-in-pattaya"],
      },
      {
        title: "Settling in",
        blurb: "Fitting in, and what changes if you're retiring or working online.",
        slugs: ["learning-thai", "cultural-mistakes-in-thailand", "retiring-in-pattaya", "pattaya-for-digital-nomads"],
      },
      {
        title: "Getting around",
        blurb: "Arriving, driving, and whether to rent or buy a car.",
        slugs: [
          "bangkok-airport-to-pattaya",
          "driving-in-pattaya",
          "scooter-or-car-in-pattaya",
          "buying-vs-renting-a-car-in-thailand",
        ],
      },
      {
        title: "Life outside work",
        blurb: "Where I eat, play and spend my evenings.",
        slugs: [
          "best-time-to-visit-pattaya",
          "staying-fit-in-pattaya",
          "golf-in-pattaya",
          "where-a-restaurant-owner-eats-in-pattaya",
          "nightlife-in-pattaya",
          "watching-football-in-pattaya",
        ],
      },
    ],
  },
  {
    slug: "pattaya-for-families",
    name: "Pattaya for families",
    planning: "Moving with my family",
    title: "Pattaya for families: a parent's guide",
    metaTitle: "Pattaya for Families: Safety, Schools, Areas and Costs | Shane Ruddle",
    description:
      "I'm raising my kids in Pattaya. Safety, international schools and fees, the best area for families, costs, healthcare and what there is for kids to do.",
    intro:
      "I've brought up my own children in Pattaya. When I arrived, I'd have had real reservations. Today I think it's a great place to raise a family, and this is what I'd want to know if I were starting out.",
    askTopic: "family",
    faqs: [
      {
        q: "Is Pattaya good for families?",
        a: "Yes. In 2026 Pattaya is a great place to raise a family. There's far more for children to do than 20 years ago, and many more schools.",
        slug: "is-pattaya-good-for-families",
      },
      {
        q: "Is Pattaya safe for children?",
        a: "Very safe, in my experience. In over 20 years I've never felt my kids were at risk from crime. The real danger is the roads, so drive them in a car, or make sure everyone wears a helmet on a motorbike.",
        slug: "is-pattaya-safe",
      },
      {
        q: "What's the best area in Pattaya for families?",
        a: "East Pattaya. Most of the international schools are there, it's mainly houses and villas so you get space, and much of what kids do is on that side of town.",
        slug: "is-pattaya-good-for-families",
      },
      {
        q: "How much do international schools in Pattaya cost?",
        a: "Budget anything from around ฿30,000 to ฿100,000 a month per child, spread over the year.",
        slug: "international-schools-in-pattaya",
      },
      {
        q: "Doesn't the nightlife affect family life?",
        a: "Not really, because families don't live near it. The nightlife is in the city centre, and most families live in East Pattaya, where it's barely noticeable.",
        slug: "is-pattaya-good-for-families",
      },
      {
        q: "Which hospital do families use in Pattaya?",
        a: "We've always used Bangkok Hospital Pattaya, and go to Bumrungrad in Bangkok only for specialists such as a children's dentist. Get health insurance for the whole family.",
        slug: "healthcare-in-pattaya",
      },
    ],
    chapters: [
      {
        title: "Is it safe, and is it right for us?",
        blurb: "My honest answer as a parent, including the downsides.",
        slugs: ["is-pattaya-good-for-families", "is-pattaya-safe"],
      },
      {
        title: "Schools",
        blurb: "How I chose my children's school, the main options and the fees.",
        slugs: ["international-schools-in-pattaya"],
      },
      {
        title: "Weekends and holidays",
        blurb: "Where we take the kids.",
        slugs: ["things-to-do-in-pattaya", "best-beaches-in-pattaya", "best-day-trips-from-pattaya"],
      },
      {
        title: "Also worth reading",
        blurb: "Homes, budgets and healthcare for a family move.",
        slugs: [
          "best-area-to-live-in-pattaya",
          "buying-a-house-in-pattaya",
          "is-pattaya-expensive",
          "healthcare-in-pattaya",
          "driving-in-pattaya",
        ],
        related: true,
      },
    ],
  },
  {
    slug: "buying-property-in-pattaya",
    name: "Buying property in Pattaya",
    planning: "Buying property",
    title: "Buying property in Pattaya: an agency owner's guide",
    metaTitle: "Buying Property in Pattaya as a Foreigner: The Complete Guide | Shane Ruddle",
    description:
      "Can foreigners own property in Thailand? Condos vs houses, fees, bringing money in, the market right now, and renting out or selling, from an agency owner.",
    intro:
      "I own two estate agencies in Pattaya, Alan Bolton Property Consultants and East Coast Real Estate, so I watch this market every day. This is what I tell every buyer before they spend a baht.",
    askTopic: "buying",
    faqs: [
      {
        q: "Can foreigners own property in Thailand?",
        a: "Yes, as long as it's a condo unit in a development. Within any condo building, foreigners can own up to 49% of the total floor area.",
        slug: "buying-a-condo-in-pattaya",
      },
      {
        q: "Can a foreigner buy a house in Pattaya?",
        a: "Not the way most people mean it. Foreigners can't own land in Thailand. You can get rights through a long lease, but my honest advice to anyone who wants a house is to rent.",
        slug: "buying-a-house-in-pattaya",
      },
      {
        q: "How do I pay for a condo from abroad?",
        a: "The money has to come from outside Thailand in a foreign currency, through a bank, which issues a certificate confirming it came in. It doesn't have to be the exact amount, as long as it covers the price.",
        slug: "buying-a-condo-in-pattaya",
      },
      {
        q: "What fees does a buyer pay?",
        a: "The seller pays the agency commission. Transfer fees at the land office are usually split 50-50 between buyer and seller. After you move in there are maintenance fees, and often a sinking fund.",
        slug: "buying-a-condo-in-pattaya",
      },
      {
        q: "Is now a good time to buy in Pattaya?",
        a: "It's definitely a buyer's market. And it's always a good time to buy if you know where to look, because there are fire sales all the time.",
        slug: "pattaya-property-market",
      },
      {
        q: "What's the biggest mistake foreign buyers make?",
        a: "Using freelance agents. There's no licensing for estate agents in Thailand, so with a freelancer the accountability starts and finishes with one person.",
        slug: "buying-a-condo-in-pattaya",
      },
    ],
    chapters: [
      {
        title: "The market right now",
        blurb: "Who's buying, where prices are going, and whether to buy now.",
        slugs: ["pattaya-property-market"],
      },
      {
        title: "Buying",
        blurb: "What foreigners can own, step by step, and what it costs.",
        slugs: ["buying-a-condo-in-pattaya", "buying-a-house-in-pattaya"],
      },
      {
        title: "Once you own",
        blurb: "Renting it out, and selling when the time comes.",
        slugs: ["renting-out-your-condo-in-pattaya", "selling-a-condo-in-pattaya"],
      },
      {
        title: "Inside the industry",
        blurb: "What it's really like on the agency side.",
        slugs: ["working-as-a-property-agent-in-pattaya"],
      },
      {
        title: "Also worth reading",
        blurb: "Choosing an area, renting first, and the long-term view.",
        slugs: ["best-area-to-live-in-pattaya", "renting-a-condo-in-pattaya", "where-pattaya-is-heading"],
        related: true,
      },
    ],
  },
  {
    slug: "doing-business-in-pattaya",
    name: "Doing business in Pattaya",
    planning: "Starting or buying a business",
    title: "Doing business in Pattaya: what seven businesses taught me",
    metaTitle: "Starting or Buying a Business in Pattaya: A Founder's Guide | Shane Ruddle",
    description:
      "Thai partners, work permits, which businesses work, staff, partnerships and what went wrong. Lessons from running seven businesses in Pattaya.",
    intro:
      "I started out managing a bar in Soi 13 and now own seven businesses here across property, hospitality and car rental. Here's what I'd tell a friend who wanted to start or buy one, including the mistakes.",
    askTopic: "business",
    faqs: [
      {
        q: "Do you need a Thai partner to own a business in Thailand?",
        a: "For most businesses, yes. A foreigner usually can't hold the majority, so a Thai partner holds 51%.",
        slug: "starting-or-buying-a-business-in-pattaya",
      },
      {
        q: "Do I need a work permit to work in my own business?",
        a: "If you're actively working in it, yes, absolutely. A silent investor who isn't working in the business doesn't necessarily need one.",
        slug: "starting-or-buying-a-business-in-pattaya",
      },
      {
        q: "Which businesses work in Pattaya?",
        a: "Entertainment, restaurants and guest houses. My own preference is service businesses: they need less capital up front, and there's a real need here for higher-quality service.",
        slug: "starting-or-buying-a-business-in-pattaya",
      },
      {
        q: "Should I start a business from scratch or buy one?",
        a: "It depends where you are as an entrepreneur. Starting from scratch can be cheaper up front, but building a customer base takes far longer than people expect.",
        slug: "starting-or-buying-a-business-in-pattaya",
      },
      {
        q: "Why do businesses fail in Pattaya?",
        a: "The people I see fail usually do it half-heartedly, as something to do. Take it seriously, do your due diligence, and decide with your head, not your heart.",
        slug: "starting-or-buying-a-business-in-pattaya",
      },
    ],
    chapters: [
      {
        title: "Getting started",
        blurb: "Starting vs buying, ownership rules and choosing partners.",
        slugs: ["starting-or-buying-a-business-in-pattaya", "business-partners-in-pattaya"],
      },
      {
        title: "People and customers",
        blurb: "Managing Thai staff, keeping good foreign staff, and online reviews.",
        slugs: ["managing-thai-staff", "hiring-foreign-staff-in-pattaya", "customer-service-and-online-reviews"],
      },
      {
        title: "Working for someone else",
        blurb: "Finding a job, teaching, and working in hospitality as a foreigner.",
        slugs: ["finding-a-job-in-pattaya", "teaching-english-in-pattaya", "working-in-hospitality-in-pattaya"],
      },
      {
        title: "Restaurants and bars",
        blurb: "The sector most newcomers want to get into.",
        slugs: ["running-a-restaurant-and-bar-in-pattaya"],
      },
      {
        title: "My own story",
        blurb: "How I built seven businesses, what went wrong, and how I run them now.",
        slugs: [
          "bar-manager-to-7-businesses",
          "how-i-run-seven-businesses",
          "16-years-of-pattaya-rent-a-car",
          "how-my-businesses-got-through-covid",
          "my-biggest-business-failure",
          "things-id-never-do-again-in-business",
          "my-worst-customers",
          "what-id-do-with-1-million-baht-in-pattaya",
          "how-i-use-ai-in-my-businesses",
        ],
      },
      {
        title: "Also worth reading",
        blurb: "Visas and banking for business owners.",
        slugs: ["thai-visas-in-pattaya", "banking-in-thailand-for-foreigners"],
        related: true,
      },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

/** The guide an article belongs to, for the "Part of my guide" link on article pages. */
export function guideForArticle(slug?: string): Guide | undefined {
  if (!slug) return undefined;
  return GUIDES.find((g) => g.chapters.some((c) => !c.related && c.slugs.includes(slug)));
}

export const GUIDES_META = PAGE_META["/guides"];
