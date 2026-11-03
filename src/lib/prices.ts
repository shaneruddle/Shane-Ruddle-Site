// "Am I paying too much?" Pattaya fair price checker (/pattaya-prices).
// Every price range, tip and "when it goes wrong" card lives here. `fromShane: true` means the
// figure comes from one of Shane's articles; the rest are estimates, badged on the page.
import { CURRENCIES, RENT } from "./costOfLiving";

export const PRICES_PATH = "/pattaya-prices";
export const PRICES_AS_OF = "November 2026";

export const PRICES_META = {
  title: "Am I Paying Too Much in Pattaya? Fair Price Checker From a Local Business Owner | Shane Ruddle",
  description:
    "Check any Pattaya price in seconds: baht buses, airport taxis, beer, massage, jet skis, scooter and car rental, condo rent. Enter your quote and get a straight answer from someone who's run businesses here for 20 years.",
};

export type PriceCategory = "transport" | "airport" | "food" | "activities" | "renting" | "services";

export const CATEGORIES: { id: PriceCategory; label: string }[] = [
  { id: "transport", label: "Getting around" },
  { id: "airport", label: "Airport and travel" },
  { id: "food", label: "Food and drink" },
  { id: "activities", label: "Beach and activities" },
  { id: "renting", label: "Renting" },
  { id: "services", label: "Everyday services" },
];

const A = {
  gettingAround: "/articles/getting-around-pattaya",
  airport: "/articles/bangkok-airport-to-pattaya",
  expensive: "/articles/is-pattaya-expensive",
  walkingStreet: "/articles/walking-street-pattaya",
  nightlife: "/articles/nightlife-in-pattaya",
  scooter: "/articles/scooter-or-car-in-pattaya",
  renting: "/articles/renting-a-car-in-pattaya",
  driving: "/articles/driving-in-pattaya",
  condo: "/articles/renting-a-condo-in-pattaya",
  beaches: "/articles/best-beaches-in-pattaya",
  dayTrips: "/articles/best-day-trips-from-pattaya",
  eats: "/articles/where-a-restaurant-owner-eats-in-pattaya",
  thaiFood: "/articles/thai-food-for-newcomers",
  safe: "/articles/is-pattaya-safe",
  calculator: "/cost-of-living-calculator",
};

export interface PriceItem {
  id: string;
  label: string;
  category: PriceCategory;
  /** What the price is for, e.g. "per person, one trip". */
  unit: string;
  /** Fair range in baht: what a local or a savvy regular pays. */
  fair: [number, number];
  /** Above this it's a walk-away price. Between fair[1] and this is "a bit high". */
  walkAway: number;
  tip: string;
  /** What to say or do if the quote is high. */
  haggle?: string;
  fromShane: boolean;
  href?: string;
  /** Optional link to one of Shane's businesses. */
  promo?: "prac" | "ecre";
}

export const ITEMS: PriceItem[] = [
  // ---- Getting around ----
  {
    id: "baht-bus",
    label: "Baht bus, shared ride",
    category: "transport",
    unit: "per person, one trip on a route",
    fair: [15, 20],
    walkAway: 40,
    tip: "It was ฿10 for as long as anyone can remember. In 2026, after fuel prices rose, it went up to ฿15 for most trips around town and ฿20 for longer ones. Pattaya to Jomtien with a change is still only ฿20 or ฿30.",
    haggle: "Jump on one that's already moving along the route, and when it turns somewhere you don't want to go, press the buzzer, hop off and catch another. Pay the driver when you get off. If you're asked for a lot more, you've probably hired it as a private taxi.",
    fromShane: true,
    href: A.gettingAround,
  },
  {
    id: "baht-bus-charter",
    label: "Baht bus hired privately",
    category: "transport",
    unit: "whole truck, Central Pattaya to Jomtien",
    fair: [150, 250],
    walkAway: 400,
    tip: "If you climb into an empty baht bus that's parked up and tell the driver where you're going, you've hired it as a private taxi. That's normal here, not a scam, but agree the price before you get in.",
    haggle: "Ask \"how much?\" before you sit down. If it's silly, walk to the main road and catch a shared one for ฿15 to ฿20.",
    fromShane: false,
    href: A.gettingAround,
  },
  {
    id: "motorbike-taxi",
    label: "Motorbike taxi, short hop",
    category: "transport",
    unit: "one rider, a few minutes across town",
    fair: [40, 60],
    walkAway: 100,
    tip: "When I wasn't renting a motorbike, I always used them. Keep it to short hops around the city and know the name of where you're going. You'll often get the same riders through Bolt and Grab anyway.",
    haggle: "Agree the price before you get on. Or book one through Bolt or Grab and the price is fixed.",
    fromShane: false,
    href: A.gettingAround,
  },
  {
    id: "bolt-grab",
    label: "Bolt or Grab car across town",
    category: "transport",
    unit: "Central Pattaya to Jomtien",
    fair: [120, 200],
    walkAway: 320,
    tip: "Excellent value and very convenient. You know the price up front and there's no negotiating. In my experience Bolt is generally cheaper than Grab, so check both.",
    haggle: "App prices rise in rain and at peak times. Wait ten minutes, or check the other app.",
    fromShane: false,
    href: A.gettingAround,
  },
  {
    id: "taxi-flat",
    label: "Street taxi or tuk-tuk, flat fare",
    category: "transport",
    unit: "Central Pattaya to Jomtien",
    fair: [200, 300],
    walkAway: 500,
    tip: "Metered taxis are rare in Pattaya, so street drivers quote a flat price, and the ones waiting outside Walking Street or the bus station quote the most.",
    haggle: "Open Bolt or Grab and show the driver the app price. If they won't come close, book the app.",
    fromShane: false,
    href: A.gettingAround,
  },
  // ---- Airport and travel ----
  {
    id: "airport-taxi",
    label: "Taxi, Suvarnabhumi airport to Pattaya",
    category: "airport",
    unit: "whole car, one way",
    fair: [1200, 1600],
    walkAway: 2200,
    tip: "Around ฿1,500 one way these days. There are plenty of taxis at the official taxi rank, so you don't need to pre-book. Just walk outside and get in one.",
    haggle: "Ignore anyone who approaches you inside the terminal and go to the official rank. Agree the full price, including tolls, before you set off.",
    fromShane: true,
    href: A.airport,
  },
  {
    id: "utapao-taxi",
    label: "Taxi, U-Tapao airport to Pattaya",
    category: "airport",
    unit: "whole car, one way",
    fair: [800, 1200],
    walkAway: 1600,
    tip: "U-Tapao is much closer than Bangkok, so it should cost a lot less than the Suvarnabhumi run.",
    haggle: "Check Bolt or Grab from the arrivals hall to get a benchmark before you agree a price.",
    fromShane: false,
    href: A.airport,
  },
  {
    id: "airport-bus",
    label: "Bus, Suvarnabhumi airport to Pattaya",
    category: "airport",
    unit: "per person, one way",
    fair: [130, 160],
    walkAway: 250,
    tip: "The big bus goes from the airport bus terminal and takes about two hours. It's the cheapest way, but with luggage or a family a taxi is far easier.",
    fromShane: false,
    href: A.airport,
  },
  // ---- Food and drink ----
  {
    id: "beer-bar",
    label: "Large local beer in a bar",
    category: "food",
    unit: "one large bottle of Chang, Leo or Singha",
    fair: [100, 160],
    walkAway: 250,
    tip: "I've run bars here for years. A normal bar or sports bar away from the busiest strips should sit in this range, and happy hour is cheaper still. Bars with live sport or a pool table aren't ripping you off at the top of it.",
    haggle: "There's no haggling over a beer. Check the drinks menu or the board before you order, and if there isn't one, ask.",
    fromShane: false,
    href: A.nightlife,
  },
  {
    id: "beer-walking-street",
    label: "Beer on Walking Street",
    category: "food",
    unit: "one bottle or draught",
    fair: [150, 250],
    walkAway: 350,
    tip: "You pay for the location and the show, so expect more than a side-street bar. I've not come across the old rip-offs people warn about there, but ask for a menu before you sit down in a go-go bar.",
    haggle: "Ask for the drinks price before you order and keep your bill chits. Pay as you go if you're unsure.",
    fromShane: false,
    href: A.walkingStreet,
  },
  {
    id: "street-food",
    label: "Thai street food dish",
    category: "food",
    unit: "one plate, e.g. pad kra pao or fried rice",
    fair: [50, 80],
    walkAway: 150,
    tip: "Most stalls show their prices on a board, often only in Thai. Point at what the person next to you is eating.",
    fromShane: false,
    href: A.thaiFood,
  },
  {
    id: "restaurant-meal",
    label: "Meal in a casual restaurant",
    category: "food",
    unit: "one main course and a soft drink",
    fair: [200, 350],
    walkAway: 600,
    tip: "A meal costs a couple of hundred baht, or about ฿300 with a drink. Eat out every meal and that's around ฿1,000 a day.",
    haggle: "Restaurants have menus, so this is about choosing the place, not haggling. Check whether service charge and VAT are added on top.",
    fromShane: true,
    href: A.expensive,
  },
  {
    id: "coffee",
    label: "Coffee in a café",
    category: "food",
    unit: "one latte or cappuccino",
    fair: [60, 110],
    walkAway: 180,
    tip: "Local cafés are cheaper than the international chains, and often better.",
    fromShane: false,
    href: A.eats,
  },
  // ---- Beach and activities ----
  {
    id: "thai-massage",
    label: "Thai massage",
    category: "activities",
    unit: "one hour in a street-front shop",
    fair: [250, 400],
    walkAway: 600,
    tip: "The shops along the side streets and the beach roads all show a price list outside. Hotel spas are a different product and price.",
    haggle: "Read the board outside and agree the length before you start. Tipping ฿50 to ฿100 is normal if you were happy.",
    fromShane: false,
  },
  {
    id: "foot-massage",
    label: "Foot massage",
    category: "activities",
    unit: "one hour",
    fair: [250, 350],
    walkAway: 500,
    tip: "Usually the same price as a Thai massage, or a little cheaper.",
    fromShane: false,
  },
  {
    id: "jet-ski",
    label: "Jet ski hire",
    category: "activities",
    unit: "30 minutes",
    fair: [800, 1500],
    walkAway: 2000,
    tip: "Agree the price and the time before you go out, and take a video all the way round the jet ski first. Read \"jet ski damage claim\" below before you hire one.",
    haggle: "Hire through your hotel or a company with an office and a name, not someone on the beach.",
    fromShane: false,
    href: A.beaches,
  },
  {
    id: "koh-larn-ferry",
    label: "Ferry to Koh Larn",
    category: "activities",
    unit: "per person, one way from Bali Hai pier",
    fair: [30, 40],
    walkAway: 100,
    tip: "The public ferry from Bali Hai pier is one of the best-value trips in Pattaya. A speedboat is quicker but you'll pay for the whole boat.",
    haggle: "People selling tickets away from the pier are usually selling speedboats. Walk on to the pier and buy at the ferry.",
    fromShane: false,
    href: A.dayTrips,
  },
  {
    id: "sunbed",
    label: "Beach sunbed and umbrella",
    category: "activities",
    unit: "per person, for the day",
    fair: [50, 100],
    walkAway: 200,
    tip: "The beach vendors earn their money on food and drink, so a sunbed shouldn't cost much.",
    fromShane: false,
    href: A.beaches,
  },
  // ---- Renting ----
  {
    id: "car-deposit",
    label: "Car rental deposit",
    category: "renting",
    unit: "refundable, small to mid-size car",
    fair: [5000, 8000],
    walkAway: 15000,
    tip: "The standard deposit for a small car is ฿5,000, and many companies charge ฿8,000 for a bigger one. Ours at Pattaya Rent a Car is still ฿5,000. Check the car is insured for rental use, not just personal use.",
    haggle: "A much bigger deposit, or a company that wants your passport instead, is a reason to go elsewhere.",
    fromShane: true,
    href: A.renting,
    promo: "prac",
  },
  {
    id: "car-day",
    label: "Car rental, small car",
    category: "renting",
    unit: "per day, a week or more",
    fair: [800, 1200],
    walkAway: 1800,
    tip: "Go to a reputable company. I don't understand why anyone would save a few thousand baht renting from someone whose core business isn't car rental. If you break down in the middle of nowhere, you'll wish you'd gone to a proper company.",
    fromShane: false,
    href: A.renting,
    promo: "prac",
  },
  {
    id: "scooter-day",
    label: "Scooter rental",
    category: "renting",
    unit: "per day, a 125cc automatic",
    fair: [200, 300],
    walkAway: 500,
    tip: "Rental scooters usually only carry the compulsory Por Ror Bor insurance, which covers injuries to other people, not you or the bike. Only rent one if you're very experienced and ride confidently.",
    haggle: "Weekly and monthly rates are much cheaper per day. Photograph every scratch before you ride off.",
    fromShane: false,
    href: A.scooter,
  },
  {
    id: "scooter-month",
    label: "Scooter rental, monthly",
    category: "renting",
    unit: "per month",
    fair: [2500, 4000],
    walkAway: 6000,
    tip: "A few thousand baht a month to rent a motorbike is what I'd budget if you're living here.",
    fromShane: true,
    href: A.scooter,
  },
  {
    id: "condo-1bed",
    label: "One-bed condo, long-term rent",
    category: "renting",
    unit: "per month, 12-month lease",
    fair: [Math.min(...Object.values(RENT).map((r) => r.condo1)), Math.max(...Object.values(RENT).map((r) => r.condo1))],
    walkAway: 32000,
    tip: "Around ฿18,000 a month for a one-bed in Jomtien, a bit more in Central Pattaya, Pratumnak and Wongamat, and less in East Pattaya. Newer buildings on the beach cost more, and short lets of one to six months cost more per month.",
    haggle: "Ask what's included: common fees, internet, and whether electricity is charged at the government rate or a marked-up condo rate.",
    fromShane: true,
    href: A.calculator,
    promo: "ecre",
  },
  // ---- Everyday services ----
  {
    id: "laundry",
    label: "Laundry, wash and dry",
    category: "services",
    unit: "per kilo",
    fair: [40, 60],
    walkAway: 100,
    tip: "Every soi has a laundry shop. Ironing is extra, and hotels charge far more.",
    fromShane: false,
  },
  {
    id: "haircut",
    label: "Men's haircut",
    category: "services",
    unit: "local barber",
    fair: [150, 300],
    walkAway: 500,
    tip: "A local barber is cheap and quick. The newer Western-style barbershops charge more, and many are worth it.",
    fromShane: false,
  },
  {
    id: "sim",
    label: "Tourist SIM card",
    category: "services",
    unit: "about 15 to 30 days with plenty of data",
    fair: [300, 600],
    walkAway: 1000,
    tip: "Buy it at a phone network shop in the airport or any mall. Bring your passport, because SIMs have to be registered.",
    fromShane: false,
  },
];

export const itemById = (id: string | null | undefined) => ITEMS.find((i) => i.id === id);

export type Verdict = "cheap" | "fair" | "high" | "walk";

export const VERDICTS: Record<Verdict, { label: string; line: string }> = {
  cheap: { label: "That's a good price", line: "That's at or below what locals pay. Take it." },
  fair: { label: "That's fair", line: "That's a normal price. Nobody's taking advantage of you." },
  high: { label: "A bit high", line: "It's not outrageous, but you can do better. Try the tip below." },
  walk: { label: "Walk away", line: "That's well over the going rate. I'd say no thank you and try somewhere else." },
};

export function verdictFor(item: PriceItem, quote: number): Verdict {
  if (quote < item.fair[0]) return "cheap";
  if (quote <= item.fair[1]) return "fair";
  if (quote <= item.walkAway) return "high";
  return "walk";
}

export const BAHT = (n: number) => `฿${Math.round(n).toLocaleString("en-GB")}`;

/** "฿1,200–1,600" */
export const range = (item: PriceItem) =>
  item.fair[0] === item.fair[1] ? BAHT(item.fair[0]) : `${BAHT(item.fair[0])}–${Math.round(item.fair[1]).toLocaleString("en-GB")}`;

/** Approximate value in another currency, e.g. "about £34". */
export function approx(baht: number, currency: string) {
  const c = CURRENCIES.find((x) => x.id === currency);
  if (!c || c.id === "THB") return "";
  const v = baht / c.perUnit;
  const rounded = v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  return `about ${c.symbol}${rounded.toLocaleString("en-GB")}`;
}

export const QUOTE_CURRENCIES = ["GBP", "EUR", "USD", "AUD", "RUB"] as const;

export function checkQuery(itemId: string, quote: number) {
  return `?item=${encodeURIComponent(itemId)}&quote=${Math.round(quote)}`;
}

export function checkFromSearch(search: string): { itemId?: string; quote?: number } {
  const p = new URLSearchParams(search);
  const item = itemById(p.get("item"));
  const quote = Number(p.get("quote"));
  return { itemId: item?.id, quote: item && quote > 0 ? quote : undefined };
}

// ---- When it goes wrong ----

export interface Situation {
  id: string;
  title: string;
  body: string;
  steps: string[];
  fromShane: boolean;
  href?: string;
}

export const SITUATIONS: Situation[] = [
  {
    id: "jet-ski",
    title: "A jet ski operator says you damaged it",
    body: "This is the one you'll read about most: you bring a jet ski back and you're shown damage you didn't cause and asked for a lot of money. I'll be honest, it's never happened to me or to anybody I know. But it's the story visitors ask me about, so here's what I'd do.",
    steps: [
      "Before you go out, video the jet ski all the way round, with the operator in the shot.",
      "Agree the price and the time, and hire through your hotel or a company with a proper office.",
      "If there's a dispute, stay calm and polite. Don't hand over your passport.",
      "Call the Tourist Police on 1155. They speak English and deal with exactly this.",
    ],
    fromShane: false,
    href: A.safe,
  },
  {
    id: "passport",
    title: "A scooter shop wants to keep your passport",
    body: "Plenty of small rental shops ask to hold your passport as a deposit. You need it for hotels, banks and immigration, and it's your strongest card in any dispute, so I'd rather leave a cash deposit.",
    steps: [
      "Offer a cash deposit and a photocopy of your passport instead.",
      "Photograph every scratch and dent before you ride off, with the shop owner watching.",
      "Get a written receipt for the deposit.",
      "If they won't budge, there's another rental shop a few doors down.",
    ],
    fromShane: false,
    href: A.scooter,
  },
  {
    id: "checkpoint",
    title: "You're stopped at a police checkpoint",
    body: "The police do check tourists on scooters, but it's a lot more professional than it used to be. Stops have to be organised checkpoints and they can't single out foreigners.",
    steps: [
      "If you don't have a licence they're happy with, it's a ฿500 fine.",
      "These days you can't pay it there and then. You go to the police station to pay it.",
      "Avoid it altogether: get an International Driving Permit before you come. It's cheap and saves the argument.",
    ],
    fromShane: true,
    href: A.driving,
  },
  {
    id: "car-scrape",
    title: "A minor scrape in a rental car",
    body: "If it's an emergency, call an ambulance or the police first. Otherwise, call your rental company before you do anything else. With our cars, we always ask customers to phone us first.",
    steps: [
      "Phone the rental company first, not the insurer.",
      "If you call the insurer yourself, it becomes an insurance claim and you can lose your ฿5,000 deposit over a scrape that might have cost a few thousand baht to fix.",
      "Take photos of both vehicles and the other driver's details.",
    ],
    fromShane: true,
    href: A.driving,
  },
  {
    id: "no-meter",
    title: "A taxi won't use the meter",
    body: "Metered taxis are rare in Pattaya, so a flat quote isn't a scam in itself. It's only a problem if the number is silly.",
    steps: [
      "Check the price on Bolt or Grab. That's your benchmark.",
      "Show the driver the app price. Many will match it or come close.",
      "If not, book the app. For a seven-day holiday I'd use Bolt or Grab anyway.",
    ],
    fromShane: false,
    href: A.gettingAround,
  },
  {
    id: "baht-bus-charter",
    title: "The baht bus driver asks for ฿200",
    body: "You've almost certainly hired it as a private taxi, usually by getting into an empty one and saying where you want to go. That's normal practice, not a scam.",
    steps: [
      "Pay what you agreed, or ask before you get in next time.",
      "To ride shared, flag one already driving along the route and don't tell the driver where you're going.",
      "Press the buzzer to stop and pay the driver ฿15 to ฿20 when you get off.",
    ],
    fromShane: false,
    href: A.gettingAround,
  },
];

export const PRICES_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "How much is a baht bus in Pattaya?",
    a: "฿15 for most trips around town and ฿20 for longer ones, since fuel prices rose in 2026. It was ฿10 for years. If you hire an empty one privately, agree the price first.",
    href: A.gettingAround,
  },
  {
    q: "How much is a taxi from Bangkok airport to Pattaya?",
    a: "Around ฿1,500 one way from the official taxi rank at Suvarnabhumi. You don't need to pre-book.",
    href: A.airport,
  },
  {
    q: "Is Pattaya expensive?",
    a: "Not if you live like a local. A meal costs a couple of hundred baht, about ฿300 with a drink, and a one-bed condo is around ฿18,000 a month. Prices go up where tourists cluster, so a quick check saves a lot.",
    href: A.expensive,
  },
  {
    q: "Are jet ski scams in Pattaya real?",
    a: "They're the scam visitors ask me about most. It's never happened to me or anyone I know, but video the jet ski before you go out, agree the price first, and call the Tourist Police on 1155 if there's a dispute.",
    href: A.safe,
  },
  {
    q: "How much is the deposit to rent a car in Pattaya?",
    a: "The standard is ฿5,000 for a small car, and many companies charge ฿8,000 for a bigger one. Ours at Pattaya Rent a Car is ฿5,000.",
    href: A.renting,
  },
];
