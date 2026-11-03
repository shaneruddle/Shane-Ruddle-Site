import type { AskTopic } from "../components/AskShane";
import { ecreUrl } from "./areas";

// "Real questions, answered": /questions and /questions/<slug>.
// Questions come from enquiries Shane has had over the years (property, rentals, car rental and
// readers), reworded so nobody can be identified. Answers are condensed from his own articles,
// so if an article's figures change, change the answer here too.

export const QUESTIONS_PATH = "/questions";
export const ANSWERS_AS_OF = "November 2026";

export type QuestionTopic = "buying" | "renting" | "pets" | "retiring" | "visas" | "money" | "family" | "business" | "cars";

export const QUESTION_TOPICS: { id: QuestionTopic; label: string; ask: AskTopic }[] = [
  { id: "buying", label: "Buying & selling", ask: "buying" },
  { id: "renting", label: "Renting", ask: "renting" },
  { id: "retiring", label: "Retiring", ask: "retiring" },
  { id: "visas", label: "Visas", ask: "visa" },
  { id: "family", label: "Families & schools", ask: "family" },
  { id: "pets", label: "Pets", ask: "renting" },
  { id: "money", label: "Money & banking", ask: "other" },
  { id: "business", label: "Business", ask: "business" },
  { id: "cars", label: "Cars & getting around", ask: "visiting" },
];

export interface QuestionLink {
  label: string;
  href: string;
  /** For analytics: what the link leads to. */
  kind: string;
}

export interface ShaneQuestion {
  slug: string;
  /** The question, in the asker's words (reworded). */
  q: string;
  /** Anonymous label, e.g. "a first-time buyer". Shown as "Asked by …". */
  askedBy: string;
  topic: QuestionTopic;
  /** The one-line answer, shown in bold and used for search snippets. */
  short: string;
  /** The rest of the answer, one string per paragraph. */
  answer: string[];
  /** Article slugs this answer comes from (first one is the main "read more"). */
  articles: string[];
  /** Optional next step: a tool on the site or one of Shane's businesses. */
  next?: QuestionLink;
  metaTitle?: string;
}

const TOOLS = {
  calculator: { label: "Work out your monthly budget", href: "/cost-of-living-calculator", kind: "cost_calculator" },
  areas: { label: "Find the right area for you", href: "/areas", kind: "area_finder" },
  visas: { label: "Find the right visa in six questions", href: "/thai-visas", kind: "visa_finder" },
  schools: { label: "Compare international schools", href: "/international-schools-pattaya", kind: "school_finder" },
  planner: { label: "Plan your move month by month", href: "/move-to-thailand", kind: "move_planner" },
  rentals: (c: string) => ({ label: "See rentals at East Coast Real Estate", href: ecreUrl(`question_${c}`), kind: "ecre_rentals" }),
  ecre: (c: string) => ({ label: "Talk to East Coast Real Estate", href: ecreUrl(`question_${c}`), kind: "ecre" }),
  prac: { label: "Rent a car from Pattaya Rent a Car", href: "https://pattayarentacar.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=questions", kind: "prac" },
};

export const QUESTIONS: ShaneQuestion[] = [
  // ---------------------------------------------------------------- Buying & selling
  {
    slug: "can-a-foreigner-buy-a-condo-in-thailand",
    q: "Can I actually buy a condo in Pattaya as a foreigner, in my own name?",
    askedBy: "a buyer planning a first visit",
    topic: "buying",
    short: "Yes. Foreigners can own a condo unit outright, in their own name, as long as it's in the building's foreign quota.",
    answer: [
      "It has to be a condo in a development, not a house or land. Within any condo building, foreigners can own up to 49% of the total floor area.",
      "The money has to come in from abroad, in a foreign currency, through a bank. The bank gives you a certificate showing it came in, and it's converted to baht for the purchase. You don't have to send the exact price: bring in ฿8 million for a ฿6 million condo and that's fine.",
      "Thailand is very accommodating about foreign ownership, as long as it's the right type of property. Most of the risk is in who you buy through and which building you pick, not in the law.",
    ],
    articles: ["buying-a-condo-in-pattaya"],
    next: TOOLS.ecre("buy_condo"),
    metaTitle: "Can a Foreigner Buy a Condo in Thailand? Yes, Here's How (2026)",
  },
  {
    slug: "how-does-the-foreign-quota-work",
    q: "The agent says the foreign quota in a building is almost full. How does the 49% actually work?",
    askedBy: "a buyer looking at a new development",
    topic: "buying",
    short: "The 49% is counted by floor area, not by the number of units, so what's left depends on the size of the units still available.",
    answer: [
      "Most people assume that in a building of 100 units, 49 can go to foreigners. It doesn't work like that. The quota is measured in square metres.",
      "So in a building with a mix of studios and big penthouses, a couple of large units can use up a lot of the quota, and the number of units you can still buy in your own name depends on their size.",
      "If you're set on a particular building, ask the agent or the developer how many square metres are left in the foreign quota, and which units that covers, before you fall in love with one.",
    ],
    articles: ["buying-a-condo-in-pattaya"],
    next: TOOLS.ecre("foreign_quota"),
  },
  {
    slug: "can-a-foreigner-own-a-house-or-land-in-thailand",
    q: "Can I buy a house with a bit of land as a foreigner?",
    askedBy: "a couple who want a garden",
    topic: "buying",
    short: "Not the land. Foreigners can't own land in Thailand, and my honest advice to anyone who wants a house is to rent one.",
    answer: [
      "You can own a house in your own name but not the land it stands on, which means whoever owns the land could, in theory, lock you out.",
      "Buying through a company is still possible with a genuinely trading company, but you can only hold 49% of it, and the Thai shareholders must be genuine. Nominees are illegal. If you go that way, have a Thai lawyer set it up properly.",
      "The other route is a lease of up to 30 years, registered on the title deed. It's well protected, but it's only 30 years. I've always rented, and it avoids all of these problems.",
    ],
    articles: ["buying-a-house-in-pattaya"],
    next: TOOLS.rentals("house"),
    metaTitle: "Can a Foreigner Own a House or Land in Thailand? (2026)",
  },
  {
    slug: "is-a-30-year-lease-safe-in-thailand",
    q: "Is a 30-year lease on a house safe? The seller says it renews for another 30.",
    askedBy: "a buyer looking at villas",
    topic: "buying",
    short: "The 30 years are well protected. The renewal promise is the part I wouldn't count on.",
    answer: [
      "A lease of up to 30 years is registered on the back of the title deed, the Chanote. For those 30 years you have unrestricted use of the property, and the lease can be inherited and transferred.",
      "You'll often hear about options to renew for a further 30, or 60, years. I wouldn't count on them. Price it as if you're getting 30 years and nothing more.",
      "The biggest risk with houses is bad advice: years later people find the seller never really owned it, or there was a debt against it. Get a second opinion, even on a lawyer's advice.",
    ],
    articles: ["buying-a-house-in-pattaya"],
  },
  {
    slug: "buying-property-in-thai-spouses-name",
    q: "My wife is Thai. Should we just buy the house in her name?",
    askedBy: "a married couple",
    topic: "buying",
    short: "You can, but think hard about what happens if the marriage ends, and get independent legal advice first.",
    answer: [
      "Buying in your Thai spouse's name is allowed and it's one way of doing it. Usually, though, people still set up a company so there's something closer to a 50-50 share.",
      "When a Thai spouse buys land, both of you have to confirm in writing at the Land Office that the money is the Thai spouse's own personal property. That can leave you with very little claim later.",
      "Get independent legal advice before you buy. Personally, I'd rent here too.",
    ],
    articles: ["buying-a-house-in-pattaya"],
  },
  {
    slug: "who-pays-the-fees-when-buying-a-condo",
    q: "What fees will I pay on top of the price when I buy a condo?",
    askedBy: "a first-time buyer",
    topic: "buying",
    short: "The seller pays the agency's commission. The transfer fees at the land office are usually split 50-50.",
    answer: [
      "How much the transfer fees come to depends on the property's value and how long the seller has owned it. The 50-50 split is the general rule but it's negotiable. A good agency will give you the figures before you go to the land office.",
      "After you move in there are ongoing costs: monthly maintenance fees, and in many buildings a sinking fund, which the management sets aside for bigger jobs like repainting the building.",
      "Ask what the maintenance fee is and how healthy the building's funds are before you buy. A badly run building can knock a lot off what your unit is worth.",
    ],
    articles: ["buying-a-condo-in-pattaya"],
    next: TOOLS.ecre("fees"),
  },
  {
    slug: "off-plan-or-resale-condo-pattaya",
    q: "Off-plan or resale: which would you buy?",
    askedBy: "an investor",
    topic: "buying",
    short: "Both have their place. Off-plan spreads the payments and gives you something brand new; resale means you see exactly what you're getting.",
    answer: [
      "Off-plan usually means 20 to 25% down, monthly payments through a build of four years or so, then a balloon payment at the end. If your plans change you can often sell the contract. The risk is that you're buying a promise, so stick to reputable developers. It's rare now for a building not to be finished; more often some promised features don't turn out as described.",
      "With resale you can walk around it and talk to the people who live there, but you need all the money up front.",
      "Either way, the building matters more than the unit. The management company, the facilities and how the money is spent decide what your condo is worth in ten years.",
    ],
    articles: ["buying-a-condo-in-pattaya"],
  },
  {
    slug: "is-now-a-good-time-to-buy-in-pattaya",
    q: "Is now a good time to buy in Pattaya, or should I wait?",
    askedBy: "a buyer watching the market",
    topic: "buying",
    short: "It's a buyer's market. There are fire sales all the time if you're registered with the agencies and ready to move fast.",
    answer: [
      "There are really two markets. The high end is buoyant. At the other end there are thousands of ฿2 to ฿3 million condos competing with each other, and prices there are down a little.",
      "To find the real deals, register with all the agencies, tell them you're not in a rush but you are looking, and stay in touch. You can view and put a deposit down within a few hours here, so be ready.",
      "I think the next couple of years will be uncertain, but long term I think Pattaya has an awful lot of growth in it.",
    ],
    articles: ["pattaya-property-market", "where-pattaya-is-heading"],
    next: TOOLS.ecre("market"),
  },
  {
    slug: "what-rental-yield-can-i-get-in-pattaya",
    q: "What rental return can I realistically expect from a condo?",
    askedBy: "an investor",
    topic: "buying",
    short: "Realistically 5 to 6% a year over ten years, once you take out maintenance, wear and tear and empty months.",
    answer: [
      "If you're lucky, 7 or 8%, but to get that you have to have bought really smart, with a bit of luck on location too.",
      "The people I've met who made money from property here didn't do it through rent. They made it on the purchase: the right building, in an area on the way up.",
      "One good long-term tenant, with an agency managing it, is a fairly passive income. Short-term letting is a lot more hassle and many buildings don't allow it.",
    ],
    articles: ["renting-out-your-condo-in-pattaya", "buying-a-condo-in-pattaya"],
    metaTitle: "Pattaya Condo Rental Yield: What Return to Expect (2026)",
  },
  {
    slug: "can-i-rent-my-pattaya-condo-on-airbnb",
    q: "Can I put my condo on Airbnb when I'm not using it?",
    askedBy: "an owner who lives abroad half the year",
    topic: "buying",
    short: "Not by the day or week. Lets need to be at least a month, and most buildings won't allow anything shorter.",
    answer: [
      "Renting by the day or week is generally treated as running an unlicensed hotel, and most condo managements won't allow it.",
      "I get the appeal, but having lots of different people going in and out isn't the right way to do it. Every new guest is another chance of a bad one.",
      "You're better off with one good long-term tenant. Keep it clean, furnished and basic, with fast internet, and use an agency.",
    ],
    articles: ["renting-out-your-condo-in-pattaya"],
  },
  {
    slug: "can-i-manage-a-pattaya-rental-from-abroad",
    q: "I live overseas. Can I rent out my condo without being there?",
    askedBy: "an overseas owner",
    topic: "buying",
    short: "Yes, but not entirely from abroad. You need someone on the ground, and about 90% of overseas owners use an agency.",
    answer: [
      "You could ask the building's management to keep an eye on it, but that's risky. It isn't what they do for a living.",
      "Agencies all charge the same, one month's rent as commission on a 12-month contract, so it costs you the same to use one with a long track record as a brand-new one.",
      "If it isn't renting, the reason is usually exposure, not price. List with a couple of agencies whose customers don't overlap, then add more over time.",
    ],
    articles: ["renting-out-your-condo-in-pattaya"],
    next: TOOLS.ecre("landlord"),
  },
  {
    slug: "how-do-i-price-my-condo-to-sell",
    q: "How do I work out what my condo is really worth before I sell?",
    askedBy: "an owner thinking of selling",
    topic: "buying",
    short: "Ignore the asking prices around you, and ask two or three agencies for a valuation. Overpricing is the biggest mistake sellers make.",
    answer: [
      "There's no public record of what anyone actually sold for here, and when people tell you what they got, it's often inflated. Asking prices are just that.",
      "Agencies have far more data, because it's what we do for a living. Asking a few is also a good test: the one that gets back to you first is the one to list with first.",
      "My usual advice is to list exclusively with one agency for about three months, then open it up. And when an offer comes in, think about what you'd do with the money now versus a higher price a year from now.",
    ],
    articles: ["selling-a-condo-in-pattaya"],
    next: TOOLS.ecre("valuation"),
  },
  {
    slug: "should-i-renovate-an-old-condo",
    q: "I've found a cheap condo in an older building. Is it worth doing it up?",
    askedBy: "a buyer on a budget",
    topic: "buying",
    short: "Be careful. Plenty of people renovate beautifully and then can't sell at the price they want, because the building is still old.",
    answer: [
      "It's like putting flashy alloy wheels on a 1980s car. It doesn't make the car worth any more.",
      "If you want to live there and you like the building, fine. But don't expect the renovation to come back to you in the price.",
      "Look at the building and its management first. A fantastic unit in a badly run building can lose value fast.",
    ],
    articles: ["buying-a-condo-in-pattaya"],
  },
  {
    slug: "biggest-mistake-buying-property-in-pattaya",
    q: "What's the biggest mistake foreigners make when buying here?",
    askedBy: "a reader",
    topic: "buying",
    short: "Using freelance agents. There's no licensing for estate agents in Thailand, so accountability starts and ends with one person.",
    answer: [
      "People meet someone on Facebook and trust them with millions of baht in a foreign country. Often there's no office and no agency with a track record behind them.",
      "Go to an agency that's been around for years. I'd say that even if I didn't own two of them.",
      "The second mistake is choosing the unit and forgetting the building.",
    ],
    articles: ["buying-a-condo-in-pattaya"],
    next: TOOLS.ecre("mistakes"),
  },

  // ---------------------------------------------------------------- Renting
  {
    slug: "can-i-rent-a-condo-in-pattaya-for-a-few-months",
    q: "Can I rent a condo for three to six months instead of a full year?",
    askedBy: "a couple trying Pattaya before they commit",
    topic: "renting",
    short: "Six months is possible with some owners, usually at a slightly higher rent. Twelve months is the norm.",
    answer: [
      "Around 80% of landlords want a 12-month contract. The ones who accept six months are usually owners whose place has been on the market a while, and a six-month renter normally pays a little more.",
      "Rentals need to be a month or more. Anything by the day or week is treated as a hotel, so for a short first look, a hotel or serviced apartment is simpler.",
      "Renting before you buy is exactly what I'd do, and most people move area at least once as their life changes.",
    ],
    articles: ["renting-a-condo-in-pattaya", "best-area-to-live-in-pattaya"],
    next: TOOLS.rentals("short_let"),
    metaTitle: "Can You Rent a Condo in Pattaya for 3 to 6 Months? (2026)",
  },
  {
    slug: "how-much-deposit-to-rent-a-condo-in-pattaya",
    q: "How much do I need up front to rent a condo, and is there an agency fee?",
    askedBy: "someone moving next month",
    topic: "renting",
    short: "Usually two months' deposit plus one month's rent in advance. The renter pays no agency fee.",
    answer: [
      "The owner pays the agency's introduction fee. The only exception is if you agree to rent somewhere and then back out before signing, when some charge a cancellation fee.",
      "Electricity and water are charged at the standard government rate in about 99% of rentals now.",
      "Take photos of everything when you move in. It makes getting the deposit back much easier.",
    ],
    articles: ["renting-a-condo-in-pattaya"],
    next: TOOLS.rentals("deposit"),
  },
  {
    slug: "how-much-does-it-cost-to-rent-a-condo-in-pattaya",
    q: "What should I budget for a decent one-bed condo?",
    askedBy: "a remote worker",
    topic: "renting",
    short: "Around ฿20,000 a month. Our average across both agencies is just over ฿18,000 for a one-bed of 30 to 45 square metres.",
    answer: [
      "What ฿20,000 gets you depends a lot on the area: a small one-bed in Central Pattaya or Pratumnak, a slightly bigger one in an older Jomtien building, maybe only a studio in Wongamat, or a two- or three-bed house in East Pattaya.",
      "Choose the building, not just the room. The pool, the gym and the internet make a bigger difference once you've signed for a year than the view from the bedroom.",
    ],
    articles: ["renting-a-condo-in-pattaya", "best-area-to-live-in-pattaya"],
    next: TOOLS.calculator,
    metaTitle: "How Much Is Rent in Pattaya? A One-Bed Condo Budget (2026)",
  },
  {
    slug: "why-do-renters-lose-their-deposit-in-pattaya",
    q: "Friends lost their whole deposit at the end of a lease. How do I avoid that?",
    askedBy: "a first-time renter",
    topic: "renting",
    short: "It mostly happens to people who rented direct or through a freelancer. A proper agency mediates when there's a disagreement.",
    answer: [
      "The contract should say clearly that normal wear and tear is acceptable. The trouble is that wear and tear is subjective, and that's where someone neutral helps.",
      "Most experienced landlords are fair and the deposit goes straight back. Some keep 10 or 20% for small things, so expect a little to be kept.",
      "Photos or a video on the day you move in are your best protection.",
    ],
    articles: ["renting-a-condo-in-pattaya", "renting-out-your-condo-in-pattaya"],
  },
  {
    slug: "how-much-to-rent-a-house-with-a-pool-in-pattaya",
    q: "What does a family house with a pool cost to rent?",
    askedBy: "a family of four",
    topic: "renting",
    short: "Roughly ฿40,000 to ฿50,000 a month with a pool, or ฿30,000 to ฿40,000 without.",
    answer: [
      "Most families live in East Pattaya, close to the international schools, with some in Jomtien. Family-sized condos are hard to find, so most end up in a house.",
      "For about ฿20,000 a month in East Pattaya you might get a two- or three-bedroom house, but without a pool.",
      "It's spread out, so plan on a car.",
    ],
    articles: ["buying-a-house-in-pattaya", "is-pattaya-good-for-families"],
    next: TOOLS.rentals("family_house"),
  },

  // ---------------------------------------------------------------- Pets
  {
    slug: "can-i-rent-a-condo-in-pattaya-with-a-dog",
    q: "We're bringing our dog. Will we find a condo that allows pets?",
    askedBy: "a couple moving with a dog",
    topic: "pets",
    short: "It's hard. Very few condos allow pets, so most pet owners end up renting a house, usually in East Pattaya.",
    answer: [
      "This matters more than anything else about having a pet here: your choice of places to live shrinks enormously. Some landlords don't want pets in their houses either, so say so up front.",
      "East Pattaya is where most pet owners live. It's mainly houses, it's quieter, and you'll want a car.",
      "Think about the breed and the heat too. There aren't many places to walk a dog, and midday walks aren't much fun for either of you.",
    ],
    articles: ["dogs-in-pattaya", "best-area-to-live-in-pattaya"],
    next: TOOLS.rentals("pets"),
    metaTitle: "Pet-Friendly Rentals in Pattaya: Can You Rent With a Dog? (2026)",
  },
  {
    slug: "are-street-dogs-dangerous-in-pattaya",
    q: "Are the street dogs dangerous? I like to run.",
    askedBy: "a runner",
    topic: "pets",
    short: "Only in certain remote spots, and in my experience they only come at you if you startle them.",
    answer: [
      "You won't come across them walking around the city. They're in quieter, remote places, which unfortunately are often the best places to run.",
      "If one comes at you, I bark back. It seems to work.",
      "If you are bitten, don't take chances: wash the wound thoroughly with soap and water and get to a hospital for rabies treatment straight away.",
    ],
    articles: ["dogs-in-pattaya", "staying-fit-in-pattaya"],
  },

  // ---------------------------------------------------------------- Retiring
  {
    slug: "how-much-money-do-i-need-to-retire-in-pattaya",
    q: "How much a month do I really need to retire comfortably in Pattaya?",
    askedBy: "a retiree planning a move",
    topic: "retiring",
    short: "A single person in a one-bed condo, eating out every meal, spends roughly ฿50,000 to ฿55,000 a month. Cook some meals and it drops a lot.",
    answer: [
      "That's about ฿18,000 for rent, around ฿30,000 eating out every meal, and a few thousand to get around.",
      "What catches people out is going out, visas and admin, and health insurance, which I'd never skip.",
      "For the retirement visa you'll also need to show ฿800,000 in a Thai bank, or ฿65,000 a month in income, or a mix of the two.",
    ],
    articles: ["is-pattaya-expensive", "retiring-in-pattaya"],
    next: TOOLS.calculator,
    metaTitle: "How Much Money Do You Need to Retire in Pattaya? (2026)",
  },
  {
    slug: "thai-retirement-visa-requirements",
    q: "What do I need for a retirement visa?",
    askedBy: "a 58-year-old planning to retire",
    topic: "retiring",
    short: "You need to be 50 or over and show ฿800,000 in a Thai bank account, or an income of ฿65,000 a month, or a combination.",
    answer: [
      "There are two versions: the Non-Immigrant O, applied for and then extended yearly here, or the O-A, applied for from your home country.",
      "As Thai visas go it's relatively simple. Once you can prove the money, it's straightforward. Even so, I'd always use an agent; it makes the whole thing a lot less painful.",
      "Rules change often, so check the current requirements before you apply.",
    ],
    articles: ["thai-visas-in-pattaya", "retiring-in-pattaya"],
    next: { label: "Read the retirement visa guide", href: "/thai-visas/retirement-visa", kind: "visa_page" },
    metaTitle: "Thai Retirement Visa Requirements From Pattaya (2026)",
  },
  {
    slug: "what-catches-retirees-out-in-pattaya",
    q: "What catches retirees out most when they move here?",
    askedBy: "a reader",
    topic: "retiring",
    short: "Culture shock, mostly assuming things work the way they do back home.",
    answer: [
      "Small grievances rarely get anywhere here, and nobody will take up a minor complaint for you. And the pace is very much \"tomorrow, tomorrow\". Both take getting used to.",
      "Money is usually not the problem. Once people adjust how they live, it's very affordable.",
      "My best advice is to learn some Thai. You don't need to be fluent; it just tells people you've chosen to live here.",
    ],
    articles: ["retiring-in-pattaya", "cultural-mistakes-in-thailand"],
  },
  {
    slug: "best-area-in-pattaya-for-retirees",
    q: "Which part of Pattaya would you pick for a retired couple?",
    askedBy: "a retired couple",
    topic: "retiring",
    short: "Jomtien. It's quieter, you're right by the sea, and there are lots of retired couples, so it's easy to make friends.",
    answer: [
      "Jomtien also has older buildings, which helps: ฿20,000 a month usually gets you a bigger one-bed than in Pratumnak or Wongamat.",
      "If, after a few years, Jomtien still feels a bit busy, the natural next step is East Pattaya.",
      "Rent first and spend a whole day walking around before you choose.",
    ],
    articles: ["best-area-to-live-in-pattaya", "retiring-in-pattaya"],
    next: TOOLS.areas,
  },
  {
    slug: "do-i-need-health-insurance-in-thailand",
    q: "Do I really need health insurance, or can I just pay as I go?",
    askedBy: "a retiree",
    topic: "retiring",
    short: "Get insurance. Uninsured patients who can't pay can be turned away by private hospitals and sent to a government one.",
    answer: [
      "A standard hospital visit is normally ฿2,000 to ฿3,000. The problem isn't the small visits, it's the big ones, which can skyrocket quickly.",
      "Even with insurance, check your limits. Having a policy doesn't automatically mean you're fully covered.",
      "We've always used Bangkok Hospital Pattaya and the care is first class. My family is insured with Pacific Cross through a local broker.",
    ],
    articles: ["healthcare-in-pattaya"],
  },

  // ---------------------------------------------------------------- Visas
  {
    slug: "best-visa-for-remote-workers-in-thailand",
    q: "I work online for a UK company. Which visa should I get?",
    askedBy: "a remote worker",
    topic: "visas",
    short: "Most remote workers use the DTV, the Destination Thailand Visa: five years, up to 180 days per entry, with around ฿500,000 in savings.",
    answer: [
      "Understand what it is: essentially a long-term tourist visa. You're still classed as a tourist, so things like opening a bank account can be a problem, depending on the bank.",
      "Think about what you might want to do in a few years, not just now. If you might start working for a Thai business, that's a different visa.",
      "Rules change often, so check the current requirements before you apply.",
    ],
    articles: ["thai-visas-in-pattaya", "pattaya-for-digital-nomads"],
    next: { label: "Read the DTV guide", href: "/thai-visas/dtv-visa", kind: "visa_page" },
  },
  {
    slug: "is-thailand-privilege-visa-worth-it",
    q: "Is the Thailand Privilege (Elite) visa worth the money?",
    askedBy: "someone in their forties",
    topic: "visas",
    short: "Only if you're sure you'll never want to work here. It isn't a work visa, and it can't be converted into one.",
    answer: [
      "Someone I know paid close to a million baht for one. Very little admin, so it seemed perfect. Then he decided he wanted to work, and had to walk away from it. He's now on a business visa with a work permit, like me.",
      "Packages today start at ฿650,000 for five years.",
      "Choose the visa for the life you might want in a few years, not just the one you have now.",
    ],
    articles: ["thai-visas-in-pattaya"],
    next: TOOLS.visas,
  },
  {
    slug: "visa-to-run-your-own-business-in-thailand",
    q: "Which visa do I need to work in my own business?",
    askedBy: "someone buying a guesthouse",
    topic: "visas",
    short: "A Non-Immigrant B, the business visa, alongside a work permit. It's what I'm on.",
    answer: [
      "The process isn't straightforward and some procedures aren't written down anywhere, so use a Thai agent. The permit fee itself isn't much, but an extra ฿20,000 or so to have someone handle it is money well spent.",
      "They'll tell you exactly what you need: usually your passport, photos, and sometimes evidence such as a degree for the job you're employed to do.",
      "I've used the same agent for 20 years.",
    ],
    articles: ["thai-visas-in-pattaya", "starting-or-buying-a-business-in-pattaya"],
    next: { label: "Read the business visa guide", href: "/thai-visas/business-visa-work-permit", kind: "visa_page" },
  },
  {
    slug: "how-long-can-i-stay-in-thailand-without-a-visa",
    q: "How long can I stay without a visa while I look around?",
    askedBy: "someone planning a recce trip",
    topic: "visas",
    short: "Since 15 September 2026, most Western passports get 30 days on arrival, with one 30-day extension at Jomtien immigration.",
    answer: [
      "It used to be 60 days. The extension costs ฿1,900. Fill in the online Thailand Digital Arrival Card (TDAC) before you fly.",
      "Thirty days is fine for viewing property, meeting schools and walking a few areas, but not for living here.",
      "This changed recently, so check the current rules for your passport before you book.",
    ],
    articles: ["thai-visas-in-pattaya"],
    next: { label: "Read the visa exemption guide", href: "/thai-visas/visa-exemption", kind: "visa_page" },
  },

  // ---------------------------------------------------------------- Money & banking
  {
    slug: "can-a-foreigner-open-a-bank-account-in-thailand",
    q: "Can I open a Thai bank account as a foreigner?",
    askedBy: "someone moving next month",
    topic: "money",
    short: "Yes, but it's much harder than it used to be. You basically have to prove you live here, not that you're a tourist.",
    answer: [
      "Since the crackdown on scam centres, banks want something like a long lease with a certificate of residence, or a work permit. Even then it's at the bank's discretion and the rules differ from bank to bank.",
      "Bangkok Bank used to be the most foreigner-friendly, but it's now one of the strictest in my experience. I'd try Kasikorn (KBank) first.",
      "Once you have an account, almost everywhere takes QR payments through PromptPay, with no fees.",
    ],
    articles: ["banking-in-thailand-for-foreigners"],
    metaTitle: "Can a Foreigner Open a Bank Account in Thailand? (2026)",
  },
  {
    slug: "best-way-to-send-money-to-thailand",
    q: "What's the cheapest way to move money from home to Thailand?",
    askedBy: "a retiree",
    topic: "money",
    short: "Wise is still a good option, but high street banks are now reasonable too. Always check the exchange rate, because that's where the cost is.",
    answer: [
      "From a UK bank such as Barclays or NatWest you can send it straight across with the Thai bank's SWIFT code. The fee is usually small.",
      "Watch your transfer limits once it's here. Mine is ฿50,000 per transaction and ฿200,000 a day. Raising it now means going into a branch for a face and ID check.",
      "If you're buying property, the money must come in from abroad in a foreign currency so the bank can certify it.",
    ],
    articles: ["banking-in-thailand-for-foreigners", "buying-a-condo-in-pattaya"],
  },

  // ---------------------------------------------------------------- Families
  {
    slug: "is-pattaya-safe-for-children",
    q: "Is Pattaya actually safe for kids? People back home think we're mad.",
    askedBy: "a parent of two",
    topic: "family",
    short: "Very safe, in my experience. In over 20 years I've never felt my kids were at risk from crime. The real danger is the roads.",
    answer: [
      "If you drive your children around in a car, you're in good shape. On a motorbike, everyone needs a helmet and you need to be an experienced rider.",
      "The nightlife doesn't really touch family life, because families don't live near it. Most live in East Pattaya, where you'd barely notice it.",
    ],
    articles: ["is-pattaya-good-for-families", "is-pattaya-safe"],
    next: TOOLS.schools,
  },
  {
    slug: "how-much-are-international-schools-in-pattaya",
    q: "What do international schools in Pattaya cost?",
    askedBy: "a family relocating for work",
    topic: "family",
    short: "Roughly ฿300,000 a year at the lower end to over ฿1 million at the top, depending on the school and year group.",
    answer: [
      "In a monthly budget, allow around ฿30,000 a month per child, and that's at the lower end.",
      "My kids go to Tara Pattana. Rugby School Thailand is arguably the best, Regents is one of the longest-established, and Highgate opened in August 2026.",
      "Visit before you choose. Check each school's current fee schedule directly.",
    ],
    articles: ["international-schools-in-pattaya", "is-pattaya-good-for-families"],
    next: TOOLS.schools,
  },
  {
    slug: "best-area-in-pattaya-for-families",
    q: "Where in Pattaya do families with kids actually live?",
    askedBy: "a family of four",
    topic: "family",
    short: "East Pattaya: it's close to most of the international schools, it's mainly houses, and it's where the kids' activities are.",
    answer: [
      "With a family of three or four you need space, and family-sized condos are hard to find.",
      "It's spread out, so most families drive. Rent there before you commit to buying.",
    ],
    articles: ["is-pattaya-good-for-families", "best-area-to-live-in-pattaya"],
    next: TOOLS.areas,
  },

  // ---------------------------------------------------------------- Business
  {
    slug: "do-i-need-a-thai-partner-to-own-a-business",
    q: "Do I need a Thai partner to own a business here?",
    askedBy: "someone looking at a café",
    topic: "business",
    short: "For most businesses, yes. A Thai partner usually holds 51%, and it has to be a genuine partner, not a nominee.",
    answer: [
      "Nominee shareholding is illegal and the authorities look closely at arrangements where the foreigner funded the Thai shareholder.",
      "Your partner doesn't have to be wealthy. If you lend them the money, make it a genuine loan they repay, partly through their work in the business, and let them share in the profits and decisions.",
      "Have a Thai lawyer set up the company, the shareholding and any loan properly from the start.",
    ],
    articles: ["starting-or-buying-a-business-in-pattaya", "business-partners-in-pattaya"],
    metaTitle: "Do You Need a Thai Partner to Own a Business in Thailand? (2026)",
  },
  {
    slug: "should-i-buy-a-bar-in-pattaya",
    q: "I'm thinking of buying a bar in Pattaya. Talk me out of it?",
    askedBy: "a regular visitor",
    topic: "business",
    short: "Bars are the businesses I see fail most, often because the owner is their own best customer.",
    answer: [
      "People buy a bar because they like the idea of it. They don't take it seriously and aren't willing to learn how things work here. Bars are everywhere and cheap to buy, which is exactly why they have the highest turnover.",
      "What works: entertainment, restaurants and guest houses. My own preference is service businesses, which need less capital and there's real demand for better service.",
      "If you still want to do it, take it seriously, do your due diligence, and decide with your head, not your heart.",
    ],
    articles: ["starting-or-buying-a-business-in-pattaya", "running-a-restaurant-and-bar-in-pattaya"],
  },
  {
    slug: "what-to-check-before-buying-a-business-in-pattaya",
    q: "What should I check before buying an existing business?",
    askedBy: "someone looking at a restaurant",
    topic: "business",
    short: "The finances and why the seller really wants out, then two hidden things: whether the staff will stay, and whether every licence is in place.",
    answer: [
      "You can buy a well-run business and find the staff leave the moment you take over. Make sure the team is happy and plans to stay.",
      "Some businesses here run for years without the right paperwork, so don't assume it's in order just because it's three or four years old.",
      "Talk to other business owners. They'll tell you things you won't find on YouTube.",
    ],
    articles: ["starting-or-buying-a-business-in-pattaya"],
  },

  // ---------------------------------------------------------------- Cars & getting around
  {
    slug: "car-rental-deposit-in-pattaya",
    q: "How much deposit do car rental companies in Pattaya take?",
    askedBy: "a holidaymaker",
    topic: "cars",
    short: "The standard is ฿5,000 for a small car, and many companies charge ฿8,000 for a bigger one.",
    answer: [
      "Photograph or film the car all the way round when you pick it up. Some companies do charge for damage that was already there.",
      "The most common dispute is windscreens, which often aren't covered. Read the front of the contract, and pay the waiver if you want the peace of mind.",
      "Ours is still ฿5,000, with unlimited mileage.",
    ],
    articles: ["renting-a-car-in-pattaya"],
    next: TOOLS.prac,
  },
  {
    slug: "is-my-rental-car-insured-properly",
    q: "How do I know a rental car's insurance is actually valid?",
    askedBy: "a driver renting for a month",
    topic: "cars",
    short: "Check that it's insured for hire and rental use, not private use. You're entitled to see the policy.",
    answer: [
      "Some operators use cheaper personal insurance and rent the car out anyway. If you have an accident and the insurer finds out it was a rental, the policy can be invalid.",
      "With a reputable company you can safely assume it's right. With someone on Facebook, or a car parked by the road with no office, always ask to see it.",
    ],
    articles: ["renting-a-car-in-pattaya"],
    next: TOOLS.prac,
  },
  {
    slug: "scooter-or-car-in-pattaya",
    q: "Should I rent a scooter or a car?",
    askedBy: "a first-time visitor",
    topic: "cars",
    short: "A car, if your budget allows it. Only rent a scooter if you're an experienced, confident rider.",
    answer: [
      "Most rental scooters only carry the compulsory government insurance, which covers injuries to other people up to a limit, not you or the bike.",
      "Police checkpoints do stop tourists. Without a licence they're happy with, it's a ฿500 fine, paid at the police station.",
      "If you're set on a scooter, stay off Sukhumvit Road until you've built some confidence on the quieter beach side.",
    ],
    articles: ["scooter-or-car-in-pattaya", "driving-in-pattaya"],
    next: TOOLS.prac,
  },
  {
    slug: "do-i-need-a-thai-driving-licence",
    q: "When do I need a Thai driving licence, and how do I get one?",
    askedBy: "someone who has just moved",
    topic: "cars",
    short: "If you live here and you're here to stay, get one. With your home licence it's mostly paperwork and a few quick tests.",
    answer: [
      "Bring your passport with a non-tourist visa, your home licence, a certificate of residence or work permit, passport photos, and a medical certificate from any clinic. Go very early, as they limit numbers each day.",
      "An agent costs around ฿2,500 to ฿3,000 and holds your hand through it. The first licence lasts two years, then you renew for five.",
      "It also works as ID at banks, government offices and hotels, so you don't have to carry your passport.",
    ],
    articles: ["thai-driving-licence"],
  },
  {
    slug: "bangkok-airport-to-pattaya-taxi",
    q: "Should I pick up a hire car at the airport or get a taxi to Pattaya?",
    askedBy: "a family flying into Suvarnabhumi",
    topic: "cars",
    short: "Take a taxi, around ฿1,500, and sort out a car once you've arrived. And I run a car rental company.",
    answer: [
      "There are plenty of taxis at the official rank, so there's no need to pre-book. Grab and Bolt work too and are usually a little cheaper.",
      "After a long flight, delays, lost bags or an immigration queue make meeting someone at a set time hard. Arrive, then organise it.",
    ],
    articles: ["bangkok-airport-to-pattaya"],
  },
];

export const questionBySlug = (slug: string) => QUESTIONS.find((q) => q.slug === slug);
export const topicById = (id: QuestionTopic) => QUESTION_TOPICS.find((t) => t.id === id)!;
export const questionsForArticle = (slug: string) => QUESTIONS.filter((q) => q.articles.includes(slug));

/** A few questions picked for the homepage strip, one per main topic. */
export const FEATURED_QUESTIONS = [
  "can-a-foreigner-buy-a-condo-in-thailand",
  "how-much-money-do-i-need-to-retire-in-pattaya",
  "can-i-rent-a-condo-in-pattaya-with-a-dog",
  "is-pattaya-safe-for-children",
  "should-i-buy-a-bar-in-pattaya",
  "can-i-rent-a-condo-in-pattaya-for-a-few-months",
].map((s) => questionBySlug(s)!);

export const QUESTIONS_META = {
  title: `Pattaya Questions Answered: ${QUESTIONS.length} Real Questions About Moving, Buying and Living Here | Shane Ruddle`,
  description:
    "Real questions people have asked me about Pattaya, with straight answers: buying a condo as a foreigner, renting with a dog, retiring, visas, schools, business and cars.",
};

export function questionMeta(q: ShaneQuestion) {
  return {
    title: `${q.metaTitle ?? q.q} | Shane Ruddle`,
    description: q.short.length > 158 ? q.short.slice(0, 155).replace(/\s+\S*$/, "") + "…" : q.short,
  };
}
