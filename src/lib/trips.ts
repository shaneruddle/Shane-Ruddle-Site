// Trips from Pattaya (/trips-from-pattaya): Shane's seven road trips, each built from his own
// article in content/articles/<slug>.md. `fromShane: true` marks a figure he wrote himself;
// everything else (km, tolls, fuel, some entry fees) is an estimate and is badged on the page.
//
// HOW TO ADD A TRIP
// - Write the article first (shaneruddle-article skill), then add an object to TRIPS using its
//   slug, and add the slug to the "Trips from Pattaya" chapters in guides.ts.
// - `lat`/`lon` place it on the map automatically.
// - Bump TRIPS_CHECKED.

export const TRIPS_PATH = "/trips-from-pattaya";
export const TRIPS_CHECKED = "November 2026";

export const TRIPS_META = {
  title: "Road Trips from Pattaya: Drive Times, Costs and Where to Stay | Shane Ruddle",
  description:
    "Koh Chang, Khao Yai, Kanchanaburi, Sukhothai, Rayong, Bang Saen and Bang Saray: drive times, what each trip costs, how long to stay and where I stay, from someone who has run a Pattaya car rental company since 2010.",
};

/** Rough running costs, used for the fuel line. Estimates. */
export const FUEL_THB_PER_LITRE = 38;
export const KM_PER_LITRE = 12;
/** Small rental car per day, the middle of the range on /pattaya-prices. Estimate. */
export const CAR_HIRE_PER_DAY = 1000;

export const PRAC_URL =
  "https://pattayarentacar.com/?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=trips_from_pattaya";

export type Who = "couple" | "family" | "friends" | "solo";
export const WHO: { id: Who; label: string; people: number }[] = [
  { id: "couple", label: "A couple", people: 2 },
  { id: "family", label: "Family with kids", people: 4 },
  { id: "friends", label: "Group of friends", people: 4 },
  { id: "solo", label: "Just me", people: 1 },
];

export type Like = "beach" | "nature" | "history" | "food" | "walking" | "quiet" | "golf";
export const LIKES: { id: Like; label: string }[] = [
  { id: "beach", label: "Beaches" },
  { id: "nature", label: "Nature and wildlife" },
  { id: "history", label: "History" },
  { id: "food", label: "Seafood and good food" },
  { id: "walking", label: "Walks and treks" },
  { id: "quiet", label: "Peace and quiet" },
  { id: "golf", label: "Golf" },
];

export const NIGHTS: { value: number; label: string }[] = [
  { value: 0, label: "Day trip" },
  { value: 1, label: "1 night" },
  { value: 2, label: "2 nights" },
  { value: 3, label: "3 or 4 nights" },
  { value: 5, label: "5 nights or more" },
];

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Fit = "great" | "ok" | "not";

export interface TripFee {
  label: string;
  thb: number;
  per: "person" | "group" | "car";
  /** Paid on the way there and back (the ferry). */
  bothWays?: boolean;
  fromShane: boolean;
}

export interface Trip {
  id: string;
  /** Article slug: /articles/<slug>. */
  slug: string;
  name: string;
  tagline: string;
  /** Shane's own words, copied from the article. */
  quote: string;
  /** Drive time as Shane wrote it. */
  drive: string;
  /** One-way distance from Pattaya, estimate. */
  km: number;
  /** One-way motorway tolls for a car, estimate. */
  tolls: number;
  howToGo: string;
  /** Nights Shane recommends [min, max], and the fewest that still works. */
  stay: [number, number];
  minNights: number;
  stayLabel: string;
  whereToStay?: string;
  /** Best months (1 to 12). Empty means any time. */
  bestMonths: number[];
  avoidMonths?: number[];
  whenLabel: string;
  suits: Record<Who, Fit>;
  /** Shane's line on who it does or doesn't suit, shown as a reason. */
  suitsNote?: Partial<Record<Who, string>>;
  likes: Like[];
  things: string[];
  fees: TripFee[];
  watchOut?: string;
  lat: number;
  lon: number;
}

export const TRIPS: Trip[] = [
  {
    id: "koh-chang",
    slug: "koh-chang-from-pattaya",
    name: "Koh Chang",
    tagline: "The island where I had my first job in Thailand",
    quote: "Koh Chang is definitely worth the four-hour trip from Pattaya.",
    drive: "About 3½ hours to the ferry, then 30 minutes across",
    km: 310,
    tolls: 40,
    howToGo:
      "Drive to the ferry at Trat and take the car across. On the island you really need a car, especially with a family.",
    stay: [3, 5],
    minNights: 2,
    stayLabel: "3 or 4 nights once you know it. First time, 4 or 5, possibly a week.",
    whereToStay:
      "Turn right off the ferry for the west coast. White Sands Beach has most of the hotels and restaurants; Lonely Beach, 30 minutes on, is quieter.",
    bestMonths: [11, 12, 1, 2, 3],
    whenLabel: "I usually spend Christmas there. Waterfalls are only worth it in the rainy season.",
    suits: { couple: "great", family: "great", friends: "great", solo: "ok" },
    suitsNote: { family: "Brilliant for the kids on the beach, and a car is the way to go with children." },
    likes: ["beach", "nature", "food", "quiet"],
    things: [
      "Snorkelling by private speedboat or a bigger island-hopping boat",
      "Drive round the island and stop at the coffee shops over the sea",
      "Bang Bao fishing village in the south",
      "Restaurants on cliffs and at the water's edge, around Lonely Beach",
    ],
    fees: [
      { label: "Car ferry", thb: 280, per: "car", bothWays: true, fromShane: true },
      { label: "Ferry, per person", thb: 130, per: "person", bothWays: true, fromShane: true },
    ],
    watchOut: "The roads are steep and winding, particularly south from White Sands to Bang Bao. Take it slowly.",
    lat: 12.05,
    lon: 102.33,
  },
  {
    id: "khao-yai",
    slug: "khao-yai-from-pattaya",
    name: "Khao Yai",
    tagline: "Jungle treks, big resorts and wild elephants",
    quote: "It's a completely different side of Thailand: nature, greenery and mountain views.",
    drive: "About 4 hours",
    km: 300,
    tolls: 60,
    howToGo:
      "By car is the only sensible way. Khao Yai is huge and spread out, a taxi would be very expensive, and the roads are very good.",
    stay: [2, 2],
    minNights: 1,
    stayLabel: "Two nights, three days at most.",
    whereToStay: "One of the big resorts: low-rise, lots of land, green mountain views from the rooms.",
    bestMonths: [1, 2, 3],
    whenLabel: "The cooler months, roughly January to March. You spend a lot of time walking outside.",
    suits: { couple: "great", family: "great", friends: "great", solo: "ok" },
    likes: ["nature", "walking", "food", "quiet"],
    things: [
      "Drive round the national park and walk the short trails",
      "Book a guided jungle trek with a private guide",
      "Watch the Thai families camping in the park",
      "The resorts' restaurants and the wineries",
    ],
    fees: [
      { label: "National park, foreign adult", thb: 400, per: "person", fromShane: true },
      { label: "Park fee for the car", thb: 50, per: "car", fromShane: false },
      { label: "Private trekking guide", thb: 1000, per: "group", fromShane: true },
    ],
    watchOut: "Some treks are guide-only, because some of the elephants can be aggressive.",
    lat: 14.44,
    lon: 101.37,
  },
  {
    id: "kanchanaburi",
    slug: "kanchanaburi-from-pattaya",
    name: "Kanchanaburi",
    tagline: "History, waterfalls and a night on the river",
    quote: "Kanchanaburi, west of Bangkok, is a must if you love history, and a lovely trip for couples.",
    drive: "About 3½ to 4 hours",
    km: 320,
    tolls: 150,
    howToGo:
      "Rent a car. I don't feel safe in the minibuses, and the sights are spread out, so you need a car once you're there.",
    stay: [2, 2],
    minNights: 1,
    stayLabel: "Three days and two nights is enough, unless you're there for golf or trekking.",
    whereToStay: "At least one night in a guesthouse right on the river. Waking up there is beautiful and very quiet.",
    bestMonths: [],
    whenLabel: "Any time. Rainy season for the waterfalls and fewer people; high season for cooler days and busier markets.",
    suits: { couple: "great", family: "ok", friends: "ok", solo: "ok" },
    suitsNote: {
      family: "Not bad for families, but not ideal. My kids wouldn't be excited by the Bridge on the River Kwai.",
      couple: "Quite a romantic spot.",
    },
    likes: ["history", "nature", "golf", "quiet"],
    things: [
      "The Bridge on the River Kwai and the war cemetery",
      "Erawan Falls: levels three or four are plenty",
      "The glass skywalk by the river",
      "Scenic, quiet, excellent-value golf courses",
    ],
    fees: [{ label: "Erawan Falls, foreign adult", thb: 300, per: "person", fromShane: false }],
    watchOut: "Minibus drivers tend to drive too fast. Drive yourself and go at your own pace.",
    lat: 14.02,
    lon: 99.53,
  },
  {
    id: "sukhothai",
    slug: "sukhothai-from-pattaya",
    name: "Sukhothai",
    tagline: "Cycling round Thailand's old capital",
    quote: "It's similar to Ayutthaya, but in my opinion far more spectacular.",
    drive: "A long way. Break the journey in Kanchanaburi",
    km: 560,
    tolls: 150,
    howToGo: "We drove and broke the journey with a stop in Kanchanaburi on the way, which is worth doing anyway.",
    stay: [3, 4],
    minNights: 2,
    stayLabel: "One night in Sukhothai is enough. With a Kanchanaburi stop on the way, plan 3 or 4 nights in all.",
    bestMonths: [11, 12, 1, 2],
    avoidMonths: [6, 7, 8, 9, 10],
    whenLabel: "High season. We went over New Year, in the low 20s. In the rainy season it's stifling.",
    suits: { couple: "great", family: "not", friends: "ok", solo: "ok" },
    suitsNote: { family: "Not great for families: a lot of walking outdoors, and kids generally aren't that interested in history." },
    likes: ["history", "walking"],
    things: [
      "Rent a bicycle and cycle round the UNESCO ruins, temples and moats",
      "The evening market in the centre for a walk and street food",
    ],
    fees: [
      { label: "Bicycle hire, per day", thb: 50, per: "person", fromShane: true },
      { label: "Historical park entry", thb: 100, per: "person", fromShane: false },
    ],
    lat: 17.01,
    lon: 99.82,
  },
  {
    id: "rayong",
    slug: "rayong-from-pattaya",
    name: "Rayong",
    tagline: "My quiet escape",
    quote: "Rayong is where I go to get away from Pattaya.",
    drive: "About 1½ hours",
    km: 100,
    tolls: 40,
    howToGo: "An easy drive down the coast.",
    stay: [1, 1],
    minNights: 0,
    stayLabel: "I usually stay one night. The beaches are worth a day trip on their own.",
    whereToStay: "I usually stay at the Rayong Marriott, and I've also stayed at the Novotel.",
    bestMonths: [],
    whenLabel: "Any time of year.",
    suits: { couple: "great", family: "ok", friends: "ok", solo: "great" },
    suitsNote: { family: "Fine for a beach break, but there isn't much for kids to do.", couple: "Couples most of all." },
    likes: ["beach", "food", "walking", "quiet", "nature"],
    things: [
      "Long, white, very clean beaches",
      "The coastal trek at Khao Laem Ya, with the sea right beside you",
      "The 2 km trek up to Khao Chamao waterfall",
      "Seafood restaurants",
    ],
    fees: [{ label: "National park entry, foreign adult", thb: 200, per: "person", fromShane: false }],
    lat: 12.67,
    lon: 101.4,
  },
  {
    id: "bang-saen",
    slug: "bang-saen-from-pattaya",
    name: "Bang Saen",
    tagline: "A very Thai beach town an hour away",
    quote: "The beach is nice and clean, and it feels like going back in time a little.",
    drive: "About an hour",
    km: 85,
    tolls: 40,
    howToGo: "A short drive up the coast. You'll want the car for the monkeys and the mangrove walk.",
    stay: [1, 1],
    minNights: 0,
    stayLabel: "You could do it in a day, but whenever I go I stay one night.",
    whereToStay: "I always stay at the Amari Bangsaen on the beachfront. Good breakfast and great for kids.",
    bestMonths: [],
    whenLabel: "Any time of year.",
    suits: { couple: "ok", family: "great", friends: "ok", solo: "ok" },
    suitsNote: { family: "The kids love the monkeys, and the hotel and aquarium are great for children." },
    likes: ["beach", "food", "nature"],
    things: [
      "Burapha University's aquarium, about an hour and a half",
      "Feeding the monkeys at Khao Sam Muk from your car",
      "The mangrove boardwalk just out of town",
      "Cycling along the flat beachfront, and the seafood",
    ],
    fees: [
      { label: "Aquarium entry", thb: 200, per: "person", fromShane: true },
      { label: "Fruit for the monkeys", thb: 20, per: "group", fromShane: true },
    ],
    lat: 13.28,
    lon: 100.91,
  },
  {
    id: "bang-saray",
    slug: "bang-saray-from-pattaya",
    name: "Bang Saray",
    tagline: "Seafood, the Navy beach and a 10 km walk",
    quote: "Bang Saray is a day trip, not somewhere to stay.",
    drive: "About 30 minutes",
    km: 25,
    tolls: 0,
    howToGo: "Just south of Pattaya on Sukhumvit.",
    stay: [0, 0],
    minNights: 0,
    stayLabel: "A day trip. It's too close to bother with a hotel.",
    bestMonths: [],
    whenLabel: "Any time of year.",
    suits: { couple: "great", family: "ok", friends: "great", solo: "great" },
    likes: ["beach", "food", "walking"],
    things: [
      "Seafood restaurants all along the front",
      "Sai Kaew, the Navy beach at Sattahip: really clear water, never too busy",
      "The 10 km beach walk back towards Ocean Marina",
      "Nong Nooch, Ramayana Water Park and Khao Chi Chan nearby",
    ],
    fees: [{ label: "Navy beach, foreigners", thb: 100, per: "person", fromShane: true }],
    watchOut: "The Navy beach has a checkpoint, where you'll usually leave your passport or ID.",
    lat: 12.75,
    lon: 100.91,
  },
];

export const tripById = (id: string) => TRIPS.find((t) => t.id === id);

export interface TripChoice {
  who: Who;
  likes: Like[];
  nights: number;
  /** 1 to 12, or 0 for "not sure yet". */
  month: number;
}

export interface TripMatch {
  trip: Trip;
  score: number;
  /** Plain reasons, best first. Negative ones have good: false. */
  reasons: { text: string; good: boolean }[];
  fits: boolean;
}

/** "Nov to Mar" from a trip's best months (listed in season order). */
export const bestRange = (t: Trip) =>
  t.bestMonths.length ? `${MONTHS[t.bestMonths[0] - 1]} to ${MONTHS[t.bestMonths[t.bestMonths.length - 1] - 1]}` : "any time";

const nightsText = (n: number) => (n === 0 ? "a day trip" : n === 1 ? "1 night" : `${n} nights`);

export function matchTrips(c: TripChoice): TripMatch[] {
  return TRIPS.map((trip) => {
    let score = 0;
    let fits = true;
    const reasons: TripMatch["reasons"] = [];

    const fit = trip.suits[c.who];
    const note = trip.suitsNote?.[c.who];
    if (fit === "great") {
      score += 3;
      reasons.push({ text: note ?? `Great for ${WHO.find((w) => w.id === c.who)!.label.toLowerCase()}.`, good: true });
    } else if (fit === "not") {
      score -= 4;
      reasons.push({ text: note ?? "Not one I'd pick for you.", good: false });
    } else if (note) {
      score += 1;
      reasons.push({ text: note, good: false });
    } else score += 1;

    const liked = trip.likes.filter((l) => c.likes.includes(l));
    score += liked.length * 2;
    if (liked.length) {
      reasons.unshift({ text: `For ${liked.map((l) => LIKES.find((x) => x.id === l)!.label.toLowerCase()).join(", ")}.`, good: true });
    }

    const [lo, hi] = trip.stay;
    if (c.nights < trip.minNights) {
      score -= 6;
      fits = false;
      reasons.push({ text: `Too far for ${nightsText(c.nights)}. I'd allow ${nightsText(lo)}.`, good: false });
    } else if (c.nights >= lo && c.nights <= hi) {
      score += 3;
      reasons.push({ text: `${nightsText(c.nights).replace(/^a /, "A ")} is right for it.`, good: true });
    } else if (c.nights < lo) {
      score += 1;
      reasons.push({ text: `Doable, but I'd allow ${nightsText(lo)}.`, good: false });
    } else {
      reasons.push({ text: lo === 0 ? "It's a day trip, so pair it with somewhere else." : `More time than you need. I'd do ${nightsText(hi)}.`, good: false });
    }

    if (c.month) {
      if (trip.avoidMonths?.includes(c.month)) {
        score -= 3;
        reasons.push({ text: `${MONTHS[c.month - 1]} is the wrong time. I'd go ${bestRange(trip)}.`, good: false });
      } else if (trip.bestMonths.includes(c.month)) {
        score += 2;
        reasons.push({ text: `${MONTHS[c.month - 1]} is the best time to go.`, good: true });
      } else if (trip.bestMonths.length) {
        reasons.push({ text: `Fine in ${MONTHS[c.month - 1]}, but best ${bestRange(trip)}.`, good: false });
      }
    }

    return { trip, score, reasons, fits };
  }).sort((a, b) => b.score - a.score || a.trip.km - b.trip.km);
}

export interface CostLine {
  label: string;
  thb: number;
  fromShane: boolean;
}

/** Rough trip cost for the car and the fees. Hotels and food are left out. */
export function tripCost(trip: Trip, people: number, nights: number, rentCar: boolean): { lines: CostLine[]; total: number } {
  const lines: CostLine[] = [];
  const nightsUsed = Math.max(nights, trip.minNights);
  if (rentCar) {
    const days = Math.max(1, nightsUsed + 1);
    lines.push({ label: `Rental car, ${days} day${days > 1 ? "s" : ""}`, thb: days * CAR_HIRE_PER_DAY, fromShane: false });
  }
  lines.push({
    label: `Fuel, ${trip.km * 2} km there and back`,
    thb: Math.round(((trip.km * 2) / KM_PER_LITRE) * FUEL_THB_PER_LITRE / 10) * 10,
    fromShane: false,
  });
  if (trip.tolls) lines.push({ label: "Motorway tolls, both ways", thb: trip.tolls * 2, fromShane: false });
  for (const f of trip.fees) {
    const n = f.per === "person" ? people : 1;
    const ways = f.bothWays ? 2 : 1;
    const label = `${f.label}${n > 1 ? ` × ${n}` : ""}${ways > 1 ? ", both ways" : ""}`;
    lines.push({ label, thb: f.thb * n * ways, fromShane: f.fromShane });
  }
  return { lines, total: lines.reduce((s, l) => s + l.thb, 0) };
}

export const TRIPS_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "What are the best trips from Pattaya?",
    a: "My seven favourites are Koh Chang, Khao Yai, Kanchanaburi, Sukhothai, Rayong, Bang Saen and Bang Saray. Koh Chang is the one I go back to most: about 30 times in 20 years.",
    href: "/articles/koh-chang-from-pattaya",
  },
  {
    q: "How long is the drive from Pattaya to Koh Chang?",
    a: "About three and a half hours to the ferry at Trat, then half an hour on the ferry, so just over four hours door to door. The car ferry is about ฿280 plus ฿130 per person each way.",
    href: "/articles/koh-chang-from-pattaya",
  },
  {
    q: "Do I need a car for Khao Yai?",
    a: "Yes. It's about four hours away, the park is huge and spread out, and a taxi would be very inconvenient and very expensive. The roads are very good.",
    href: "/articles/khao-yai-from-pattaya",
  },
  {
    q: "Can you do Kanchanaburi as a day trip from Pattaya?",
    a: "Not really. It's three and a half to four hours each way. I'd stay three days and two nights, with at least one night on the river.",
    href: "/articles/kanchanaburi-from-pattaya",
  },
  {
    q: "What's the best weekend trip from Pattaya with kids?",
    a: "Bang Saen. It's an hour away, the Amari is great for kids, and they love the aquarium and feeding the monkeys at Khao Sam Muk. For a longer break, Koh Chang.",
    href: "/articles/bang-saen-from-pattaya",
  },
  {
    q: "Is it better to rent a car or take a minibus?",
    a: "Rent a car. Minibus drivers here tend to drive too fast, and most of these places are spread out, so you need a car once you arrive anyway.",
    href: "/articles/kanchanaburi-from-pattaya",
  },
];
