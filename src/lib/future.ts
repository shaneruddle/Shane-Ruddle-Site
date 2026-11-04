// "What's being built" timeline (/pattaya-future): the big projects that will change Pattaya,
// each with an honest status, the official date next to Shane's guess, how the date has moved,
// Shane's view and dated sources. Plus the new-build condo and villa projects, linked to
// pattayaproperty.com.
//
// HOW TO ADD A DEVELOPMENT
// - A big project (road, rail, airport, city plan): add an object to PROJECTS. Put the expected
//   year in `year` (null when nobody can say). It is placed on the timeline automatically.
// - A new condo or villa project: add one line to LAUNCHES with its pattayaproperty.com slug
//   (the part after /projects/ in its URL). It appears under its area automatically.
// - Then bump FUTURE_CHECKED to today's month.

export const FUTURE_PATH = "/pattaya-future";
export const FUTURE_CHECKED = "4 November 2026";

export const FUTURE_META = {
  title: "Pattaya's Future: What's Being Built and What It Means (2026 Timeline) | Shane Ruddle",
  description:
    "U-Tapao airport, the high-speed rail, the monorail, new motorways, the EEC and every new condo launch: an honest timeline of what's really being built in Pattaya, with real status and dates, from a 20-year local business owner.",
};

export type Status = "open" | "building" | "approved" | "proposed" | "stalled";

export const STATUSES: Record<Status, { label: string; short: string; help: string }> = {
  open: { label: "Open", short: "Open", help: "Finished and in use." },
  building: { label: "Under construction", short: "Building", help: "Work has started on site." },
  approved: { label: "Approved, not started", short: "Approved", help: "Signed, funded or approved, but no proper work on site yet." },
  proposed: { label: "Proposed", short: "Proposed", help: "Talked about or being studied. Nothing is signed." },
  stalled: { label: "Stalled", short: "Stalled", help: "Was going ahead, now stuck or in doubt." },
};

export type FutureCategory = "airport" | "transport" | "city";

export const FUTURE_CATEGORIES: { id: FutureCategory; label: string }[] = [
  { id: "airport", label: "Airport" },
  { id: "transport", label: "Roads and rail" },
  { id: "city", label: "City and leisure" },
];

/** Area page ids from areas.ts. */
export type AreaId = "central-pattaya" | "pratumnak" | "jomtien" | "wongamat-naklua" | "east-pattaya" | "na-jomtien-bang-saray";

export const AREA_NAMES: Record<AreaId, string> = {
  "central-pattaya": "Central Pattaya",
  pratumnak: "Pratumnak",
  jomtien: "Jomtien",
  "wongamat-naklua": "Wongamat & Naklua",
  "east-pattaya": "East Pattaya",
  "na-jomtien-bang-saray": "Na Jomtien & Bang Saray",
};

export interface Source {
  label: string;
  url: string;
}

export interface FutureProject {
  id: string;
  name: string;
  category: FutureCategory;
  status: Status;
  /** Year it is realistically expected to open; null = no believable date. Open projects: year opened, or null. */
  year: number | null;
  /** The official line on timing. */
  official: string;
  /** Shane's realistic guess. */
  myGuess: string;
  /** One or two lines on what it is. */
  what: string;
  /** Shane's view: what it means for prices, rents and daily life. */
  meaning: string;
  /** true = the view comes from one of Shane's articles; false = drafted for him, badged "My estimate". */
  fromShane: boolean;
  /** How the promised date or scope has moved over time, oldest first. */
  history?: { when: string; said: string }[];
  areas: AreaId[];
  sources: Source[];
  /** Related article on shaneruddle.com. */
  href?: string;
}

const HEADING = "/articles/where-pattaya-is-heading";

export const PROJECTS: FutureProject[] = [
  {
    id: "motorway-7",
    name: "Motorway 7 from Bangkok",
    category: "transport",
    status: "open",
    year: null,
    official: "Open",
    myGuess: "Open",
    what: "The tolled motorway from Bangkok to Pattaya, later extended south past Pattaya towards Map Ta Phut and U-Tapao.",
    meaning:
      "The one big project I've seen actually happen in 20 years. When I arrived you had to come along Sukhumvit and Bangkok was two and a half to three hours away. Motorway 7 has roughly halved that.",
    fromShane: true,
    areas: ["east-pattaya"],
    sources: [{ label: "Pattaya Mail: all sections of the Pattaya–U-Tapao–Map Ta Phut motorway open", url: "https://www.pattayamail.com/news/all-sections-of-pattaya-u-taphao-maptaphut-highway-open-312715" }],
    href: HEADING,
  },
  {
    id: "jomtien-second-road",
    name: "Jomtien Second Road",
    category: "transport",
    status: "open",
    year: null,
    official: "Open",
    myGuess: "Open",
    what: "The road running behind Jomtien Beach Road, opening up the land between the beach and Sukhumvit.",
    meaning:
      "It completely changed Jomtien. Before, it was really just Beach Road and a few side roads; now getting in and out is much easier. There's still a lot of empty land along it, so that's where I think most of Pattaya's growth will come over the next ten years.",
    fromShane: true,
    areas: ["jomtien"],
    sources: [],
    href: HEADING,
  },
  {
    id: "m7-utapao-link",
    name: "Motorway link straight into U-Tapao",
    category: "transport",
    status: "approved",
    year: 2028,
    official: "Contract signed Aug 2025, three-year build",
    myGuess: "2028–29",
    what: "A 1.92 km elevated road from Motorway 7 straight to the U-Tapao airport junction, so you don't loop round on Sukhumvit. Funded by a ฿2.4 billion Asian Development Bank loan.",
    meaning:
      "Small, boring and funded, which is exactly why I'd bet on it. It won't change prices on its own, but it makes U-Tapao a quicker trip from Pattaya, and roads are the projects that actually get built here.",
    fromShane: false,
    history: [
      { when: "Jun 2022", said: "Cabinet approves the link." },
      { when: "Aug 2025", said: "Sino-Thai (STECON) signs a ฿2.65bn contract with three years to build." },
    ],
    areas: ["na-jomtien-bang-saray"],
    sources: [
      { label: "Nation Thailand: ฿2.4bn ADB loan signed", url: "https://www.nationthailand.com/news/general/40050900" },
      { label: "Pattaya Mail: ADB loan for the U-Tapao route", url: "https://www.pattayamail.com/latestnews/news/thailand-taps-2-44-billion-baht-adb-loan-to-speed-up-travel-on-pattaya-map-ta-phut-u-tapao-airport-route-504011" },
      { label: "AseanNow (from Matichon): STECON signs the contract", url: "https://aseannow.com/topic/1368613-sino-thai-signs-deal-to-build-motorway-link-to-u-tapao/" },
    ],
  },
  {
    id: "utapao-runway",
    name: "U-Tapao second runway",
    category: "airport",
    status: "building",
    year: 2028,
    official: "2028",
    myGuess: "2028–29",
    what: "A second runway and taxiways at U-Tapao, built by the Royal Thai Navy, so the airport can take far more flights.",
    meaning:
      "This is the part of the airport plan I'd trust most, because it's government-built and already under way. A second runway on its own doesn't bring passengers, though. Airlines do.",
    fromShane: false,
    areas: ["na-jomtien-bang-saray"],
    sources: [
      { label: "Bangkok Post: second runway for U-Tapao", url: "https://bangkokpost.com/thailand/general/2863213/second-runway-for-u-tapao" },
      { label: "Wikipedia: U-Tapao International Airport", url: "https://en.wikipedia.org/wiki/U-Tapao_International_Airport" },
    ],
  },
  {
    id: "utapao-terminal-3",
    name: "U-Tapao Terminal 3 and Eastern Aviation City",
    category: "airport",
    status: "building",
    year: 2030,
    official: "3–4 years from April 2026",
    myGuess: "2030, smaller than promised",
    what: "A new passenger terminal at U-Tapao under a 50-year private concession, the first piece of a ฿290 billion 'aviation city'. The first phase has been cut from 12 million to about 3–4 million passengers a year.",
    meaning:
      "If U-Tapao ends up bringing in international flights from lots of new places, that would have a major impact on Pattaya. But the plans have been around a long time and it should have been done already. It will expand, just maybe not as promised.",
    fromShane: true,
    history: [
      { when: "Jun 2020", said: "฿290bn contract signed for a 12 million-passenger terminal and aviation city." },
      { when: "2025", said: "First phase scaled back to about 3 million passengers a year as the rail link stalls." },
      { when: "Apr 2026", said: "Notice to proceed issued. Work starts, 3–4 years to build." },
    ],
    areas: ["na-jomtien-bang-saray"],
    sources: [
      { label: "Nation Thailand: U-Tapao project kicks off on 3 April 2026", url: "https://www.nationthailand.com/business/economy/40063002" },
      { label: "Nation Thailand: Phase 1 investment scale reviewed", url: "https://www.nationthailand.com/business/economy/40052819" },
      { label: "Bangkok Post: cabinet approves ฿290bn U-Tapao upgrade", url: "https://www.bangkokpost.com/business/1928332/cabinet-approves-b290bn-upgrade-for-u-tapao-airport" },
    ],
    href: HEADING,
  },
  {
    id: "eeciti",
    name: "EEC Smart City, sports complex and entertainment hub",
    category: "city",
    status: "approved",
    year: null,
    official: "Framework approved June 2026; hub study due Nov 2026",
    myGuess: "No date yet",
    what: "A planned 'smart city' in the Eastern Economic Corridor with a ฿72 billion public-private framework for roads and utilities, plus a proposed international sports complex and an entertainment and leisure hub.",
    meaning:
      "A framework and a study are a long way from a building. I'll believe it when I see foundations. If it does happen it's jobs and spending for the whole east coast, but it's not a reason to buy anything today.",
    fromShane: false,
    areas: ["east-pattaya"],
    sources: [{ label: "Pattaya Mail: new sports, entertainment and smart city hub planned for EEC", url: "https://www.pattayamail.com/news/new-sports-entertainment-and-smart-city-hub-planned-for-eec-552491" }],
  },
  {
    id: "monorail",
    name: "Pattaya monorail",
    category: "transport",
    status: "proposed",
    year: null,
    official: "Feasibility and environmental study",
    myGuess: "I'm not holding my breath",
    what: "A monorail through the city, with three possible routes being studied. A private company pitched its own version to the mayor in September 2026.",
    meaning:
      "It keeps being talked about and it keeps not happening. Lots of projects that would have transformed the city never came off, whether it was the environmental studies or the finance.",
    fromShane: true,
    history: [
      { when: "Early plans", said: "Construction from 2023, finished by 2026." },
      { when: "2025", said: "Mayor: still under study." },
      { when: "Sep 2026", said: "Private firm pitches a monorail; still at the study stage." },
    ],
    areas: ["central-pattaya", "jomtien"],
    sources: [
      { label: "The Pattaya News: private monorail proposal (Sep 2026)", url: "https://thepattayanews.com/2026/09/02/pattaya-mayor-hears-serious-private-business-proposal-for-monorail-mass-transit-system-as-plans-for-monorail-move-rapidly-forward/" },
      { label: "Pattaya Mail: monorail still under study", url: "https://www.pattayamail.com/news/pattaya-mayor-denies-claims-of-chinese-investment-in-high-rise-construction-confirms-monorail-project-still-under-study-496524" },
    ],
    href: HEADING,
  },
  {
    id: "casino",
    name: "Entertainment complexes with casinos",
    category: "city",
    status: "proposed",
    year: null,
    official: "Bill revived in 2026, not passed",
    myGuess: "No date yet",
    what: "A law to allow a small number of large entertainment complexes with licensed casino floors. The east coast is often named as a likely location.",
    meaning:
      "It has been dropped once already and depends on who is in government. If it passes and one comes to this area, it would bring a lot of visitors and money. Until there's a law, a licence and a site, it's just talk.",
    fromShane: false,
    history: [
      { when: "Mar 2025", said: "Cabinet approves the draft bill." },
      { when: "Jul 2025", said: "Bill dropped after the prime minister is suspended." },
      { when: "2026", said: "Revived in a smaller form, up to three complexes. Not yet law." },
    ],
    areas: [],
    sources: [
      { label: "Thaiger: entertainment complex legislation in 2026", url: "https://thethaiger.com/news/business/thailands-entertainment-complex-legislation-in-2026-where-things-stand-now" },
      { label: "iGaming Business: Senate rejects casino bill", url: "https://igamingbusiness.com/casino/thailand-senate-rejects-casino-bill-legislation-could-return/" },
    ],
  },
  {
    id: "high-speed-rail",
    name: "High-speed rail linking three airports",
    category: "transport",
    status: "stalled",
    year: null,
    official: "Future decided by the EEC committee, Nov 2026",
    myGuess: "A slower upgraded line, eventually",
    what: "A 220 km high-speed line from Don Mueang through Suvarnabhumi to U-Tapao, with a station in Pattaya. Signed in 2019, never really started.",
    meaning:
      "It's been talked about for years, and in 2026 the original high-speed plan gave way to talk of upgrading the existing railway line instead. Something will probably happen eventually, but I'm not sure how much Pattaya itself will benefit.",
    fromShane: true,
    history: [
      { when: "Oct 2019", said: "Contract signed. Due to open in about five years." },
      { when: "Jun 2023", said: "Construction a year behind schedule." },
      { when: "2025", said: "Target pushed to 2029; banks hold back funding." },
      { when: "Jul 2026", said: "Private partner serves notice to end the contract." },
    ],
    areas: ["central-pattaya", "east-pattaya"],
    sources: [
      { label: "Bangkok Post: three-airport rail project lurching forward", url: "https://www.bangkokpost.com/thailand/general/3201960/threeairport-rail-project-lurching-forward" },
      { label: "Nation Thailand: EEC sees rail project at risk", url: "https://www.nationthailand.com/business/economy/40072763" },
      { label: "The Star: construction a year behind (2023)", url: "https://www.thestar.com.my/aseanplus/aseanplus-news/2023/06/29/construction-of-high-speed-railway-linking-three-thai-airports-delayed-by-a-year" },
    ],
    href: HEADING,
  },
];

// ---------------------------------------------------------------------------------------------
// New-build condo, house and villa projects, from the Pattaya Property catalogue (Nov 2026).
// Status, prices and completion dates live on each project page, which pattayaproperty.com keeps current.

export type LaunchType = "Condo" | "House" | "Villa";

export interface Launch {
  name: string;
  /** pattayaproperty.com/projects/<slug> */
  slug: string;
  area: AreaId;
  type: LaunchType;
}

const L = (name: string, slug: string, area: AreaId, type: LaunchType): Launch => ({ name, slug, area, type });

export const LAUNCHES: Launch[] = [
  // Central and South Pattaya
  L("Avenue Boutique Condominium", "avenue-boutique-condominium", "central-pattaya", "Condo"),
  L("City Garden Harmonia", "city-garden-harmonia", "central-pattaya", "Condo"),
  L("Embassy Pattaya", "embassy-pattaya", "central-pattaya", "Condo"),
  L("Grand Bay View Pattaya", "grand-bay-view-pattaya", "central-pattaya", "Condo"),
  L("Grand Solaire Noble", "grand-solaire-noble", "central-pattaya", "Condo"),
  L("PTY Residence Sai 1", "pty-residence-sai-1", "central-pattaya", "Condo"),
  L("Tait Pattaya", "tait-pattaya", "central-pattaya", "Condo"),
  L("Zenith 2 Condo", "zenith-2-condo", "central-pattaya", "Condo"),
  // Pratumnak
  L("Grand Solaire", "grand-solaire", "pratumnak", "Condo"),
  L("Level Pratumnak", "level-pratumnak", "pratumnak", "Condo"),
  L("Sea Sky by Sands", "sea-sky-by-sands", "pratumnak", "Condo"),
  L("Siam Oriental Beach", "siam-oriental-beach", "pratumnak", "Condo"),
  L("Siam Oriental Dream", "siam-oriental-dream", "pratumnak", "Condo"),
  L("Siam Oriental Oasis", "siam-oriental-oasis", "pratumnak", "Condo"),
  L("The Riviera California", "the-riviera-california", "pratumnak", "Condo"),
  L("The Riviera Malibu & Residences", "the-riviera-malibu--residences", "pratumnak", "Condo"),
  // Jomtien
  L("Aquarous", "aquarous", "jomtien", "Condo"),
  L("Copacabana Coral Reef", "copacabana-coral-reef", "jomtien", "Condo"),
  L("Embassy Life", "embassy-life", "jomtien", "Condo"),
  L("Embassy World", "embassy-world", "jomtien", "Condo"),
  L("Lucean Bay Jomtien", "lucean-bay-jomtien-pattaya", "jomtien", "Condo"),
  L("Pristine Park 3", "pristine-park-3", "jomtien", "Condo"),
  L("Seaspire Jomtien", "seaspire-jomtien", "jomtien", "Condo"),
  L("Skypark Lucean Jomtien", "sky-park-lucean", "jomtien", "Condo"),
  L("The Indeed Condo Pattaya", "the-indeed-condo-pattaya", "jomtien", "Condo"),
  L("The Riviera Beverly Hills Residences", "the-riviera-beverly-hills-residences", "jomtien", "Condo"),
  L("The Riviera Santa Monica", "the-riviera-santa-monica", "jomtien", "Condo"),
  L("Zenith Pattaya", "zenith-pattaya", "jomtien", "Condo"),
  L("Zensiri Estate & Residences", "zensiri-estate-residences", "jomtien", "Condo"),
  // Wongamat and Naklua
  L("Celine Wongamat", "celine-wongamat", "wongamat-naklua", "Condo"),
  L("Dcondo Vite", "dcondo-vite", "wongamat-naklua", "Condo"),
  L("Love It", "love-it-global-top-group", "wongamat-naklua", "Condo"),
  L("Once Wongamat", "once-wongamat", "wongamat-naklua", "Condo"),
  L("Secret Garden Condominium", "secret-garden-condominium", "wongamat-naklua", "Condo"),
  L("SO Origin Pattaya", "so-origin-pattaya", "wongamat-naklua", "Condo"),
  L("Soondri Condo", "soondri-condo", "wongamat-naklua", "Condo"),
  L("The Coral Pattaya", "the-coral-pattaya", "wongamat-naklua", "Condo"),
  L("The Lavish", "the-lavish", "wongamat-naklua", "House"),
  L("The Riviera Palm Beach Wongamat", "the-riviera-palm-beach-wongamat", "wongamat-naklua", "Condo"),
  // East Pattaya, Huay Yai and Mabprachan
  L("Araya Valley", "araya-valley", "east-pattaya", "House"),
  L("Arcade Autograph by Patta", "arcade-autograph-by-patta", "east-pattaya", "House"),
  L("Atmos Prime Villa", "atmos-prime-villa-pattaya", "east-pattaya", "House"),
  L("Avani Pool Villa", "avani-pool-villa", "east-pattaya", "Villa"),
  L("Cascade by Patta", "cascade-by-patta", "east-pattaya", "House"),
  L("Coco Ville 2", "coco-ville-2", "east-pattaya", "House"),
  L("HD Pool Villas", "hd-pool-villas", "east-pattaya", "Villa"),
  L("Highbury Hill Pool Villas", "highbury-hill-pool-villas", "east-pattaya", "House"),
  L("Huay Yai Park Villas", "huay-yai-park-villas", "east-pattaya", "House"),
  L("IMAGE Luxury Pool Villa", "image-property-luxury-pool-villa", "east-pattaya", "House"),
  L("Lake Side Court 6", "lake-side-court-6", "east-pattaya", "House"),
  L("Layan Chak Nok", "layan-chak-nok", "east-pattaya", "Villa"),
  L("Lumina", "lumina-global-top-group", "east-pattaya", "House"),
  L("M Mountain Lake", "m-mountain-lake", "east-pattaya", "House"),
  L("Marnfah Pool Villas", "marnfah-pool-villas", "east-pattaya", "Villa"),
  L("MAXX Pattaya", "maxxpattaya", "east-pattaya", "House"),
  L("Merge Residence Pattaya", "merge-residence-pattaya", "east-pattaya", "Villa"),
  L("Patta Riverine", "patta-riverine", "east-pattaya", "House"),
  L("Patta Terrane", "patta-terrane", "east-pattaya", "House"),
  L("PYCHE Pattaya Motorway", "pychepattaya---motorway", "east-pattaya", "House"),
  L("Rekha Motorway Pattaya", "rekha", "east-pattaya", "House"),
  L("Sedona Creek", "sedona-creek", "east-pattaya", "House"),
  L("Solava", "solava", "east-pattaya", "House"),
  L("Spectra Residence", "spectra-residence", "east-pattaya", "House"),
  L("The Arowanyx by Baan Mae", "the-arowanyx-by-baan-mae", "east-pattaya", "Villa"),
  L("The Lake by PCK Asset", "the-lake-by-pck-asset", "east-pattaya", "House"),
  L("The Palm Pattaya", "the-palm-pattaya", "east-pattaya", "House"),
  L("Windermere", "windermere", "east-pattaya", "House"),
  L("Zensiri Lakeside Mabprachan", "zensiri-lakeside-mabprachan", "east-pattaya", "House"),
  // Na Jomtien and Bang Saray
  L("Chern Mar Estate", "chern-mar-estate", "na-jomtien-bang-saray", "Villa"),
  L("Eco Resort by Sisaran", "eco-resort-by-sisaran", "na-jomtien-bang-saray", "Condo"),
  L("First Bay Pool Villa", "first-bay-pool-villa", "na-jomtien-bang-saray", "House"),
];

/** Area order for the launches list, and a line from Shane on each. */
export const LAUNCH_AREAS: { id: AreaId; note: string }[] = [
  { id: "jomtien", note: "Where I expect most of Pattaya's growth, along Jomtien Second Road." },
  { id: "wongamat-naklua", note: "Beachfront towers at the quieter north end." },
  { id: "pratumnak", note: "The hill between Pattaya and Jomtien. Limited land, so fewer new launches." },
  { id: "central-pattaya", note: "City-centre condos, close to everything." },
  { id: "east-pattaya", note: "Houses and pool villas with land, near the lakes and the motorway." },
  { id: "na-jomtien-bang-saray", note: "Quieter beaches to the south, closest to U-Tapao." },
];

export const launchUrl = (slug: string) =>
  `https://www.pattayaproperty.com/projects/${slug}?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=pattaya_future`;

export const PATTAYA_PROPERTY_URL = "https://www.pattayaproperty.com/projects?utm_source=shaneruddle.com&utm_medium=referral&utm_campaign=pattaya_future";

/** Timeline groups: what's already here, then by year, then the projects with no believable date. */
export function timelineGroups(list: FutureProject[]): { key: string; label: string; items: FutureProject[] }[] {
  const open = list.filter((p) => p.status === "open");
  const dated = list.filter((p) => p.status !== "open" && p.year !== null);
  const undated = list.filter((p) => p.status !== "open" && p.year === null);
  const years = [...new Set(dated.map((p) => p.year as number))].sort((a, b) => a - b);
  return [
    { key: "open", label: "Already here", items: open },
    ...years.map((y) => ({ key: String(y), label: String(y), items: dated.filter((p) => p.year === y) })),
    { key: "undated", label: "No believable date yet", items: undated },
  ].filter((g) => g.items.length > 0);
}

export const FUTURE_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "Is the high-speed train to Pattaya being built?",
    a: "No. The three-airport high-speed rail was signed in 2019 but never properly started, and in 2026 the private partner moved to end the contract. An upgrade of the existing line is now more likely. Don't buy anything because a salesperson says the train is coming.",
    href: HEADING,
  },
  {
    q: "When will U-Tapao airport's new terminal open?",
    a: "Work started in April 2026 with three to four years to build, so around 2030 at the earliest, and the first phase has been cut to about 3–4 million passengers a year. The second runway is due around 2028.",
  },
  {
    q: "Is there going to be a monorail in Pattaya?",
    a: "It's still being studied, as it has been for years. A private company pitched one in September 2026, but nothing is signed or funded.",
    href: HEADING,
  },
  {
    q: "Where in Pattaya is the most new building happening?",
    a: "Jomtien, especially along Jomtien Second Road, where there is still plenty of empty land. East Pattaya has the most new houses and pool villas.",
    href: HEADING,
  },
  {
    q: "Should I buy off-plan because of these projects?",
    a: "Buy because the building and the location suit you today. Treat any project that isn't already under construction as a bonus, not the reason. Stick to reputable developers, because you're buying a promise.",
    href: "/articles/buying-a-condo-in-pattaya",
  },
];
