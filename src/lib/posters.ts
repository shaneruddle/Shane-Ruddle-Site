// Infographic posters: one per strong page, shown at the top of that page with the same figures as a
// real table underneath (Google reads the table, people share the picture). Every figure here comes
// from the page it sits on or the cost of living calculator, so nothing conflicts. If a figure changes
// on the page, change it here and re-render the images with `npx tsx scripts/render-posters.ts`.

export type PosterId = "cost" | "retirement" | "ninety" | "lease" | "areas";

export interface PosterRow {
  label: string;
  value: string;
  /** Small line under the value (e.g. a currency conversion). */
  valueSub?: string;
  note: string;
}

export interface Poster {
  id: PosterId;
  /** Image file name in /images/posters/ (without extension or size suffix). */
  file: string;
  /** The page the poster lives on. */
  path: string;
  eyebrow: string;
  title: string;
  /** Big gold figure under the title. */
  big?: string;
  intro: string;
  columns: [string, string, string];
  rows: PosterRow[];
  total?: { label: string; value: string; sub?: string };
  pointsTitle?: string;
  points: string[];
  source: string;
  alt: string;
}

export const POSTERS_DIR = "/images/posters";
export const SITE = "https://shaneruddle.com";

export const POSTERS: Record<PosterId, Poster> = {
  cost: {
    id: "cost",
    file: "pattaya-cost-of-living-single-person",
    path: "/cost-of-living-calculator",
    eyebrow: "Cost of living · 2026",
    title: "What one person spends a month in Pattaya",
    big: "฿50,000–60,000",
    intro: "One person in a one-bed condo in Jomtien, going out once a week.",
    columns: ["Expense", "Baht a month", "What that gets you"],
    rows: [
      { label: "Rent", value: "18,000", note: "A one-bed condo in Jomtien" },
      { label: "Food and drink", value: "18,000", note: "A mix of eating out and cooking at home" },
      { label: "Getting around", value: "3,000", note: "A rented motorbike" },
      { label: "Bills, phone and internet", value: "3,500", note: "Electricity, water, mobile and wifi" },
      { label: "Healthcare", value: "4,000", note: "Health insurance, under 50" },
      { label: "Going out, gym and sport", value: "6,500", note: "Out once a week, not every night" },
    ],
    total: { label: "Total", value: "฿53,000 a month", sub: "About £1,200 or $1,600" },
    pointsTitle: "What moves the number",
    points: [
      "Eat out every meal and food rises to about ฿30,000",
      "A couple needs about ฿70,000–80,000 a month",
      "International school: from ฿30,000 a month per child",
    ],
    source: "Figures from my Pattaya cost of living calculator, 2026. Exchange rates as of August 2026.",
    alt: "Infographic: what one person spends a month in Pattaya in 2026, ฿50,000 to ฿60,000. Rent ฿18,000, food and drink ฿18,000, getting around ฿3,000, bills ฿3,500, healthcare ฿4,000, going out and gym ฿6,500. Total ฿53,000, about £1,200 or $1,600.",
  },
  retirement: {
    id: "retirement",
    file: "thai-retirement-visa-money-rule",
    path: "/thai-visas/retirement-visa",
    eyebrow: "Thai retirement visa · 2026",
    title: "The money you need for a Thai retirement visa",
    big: "฿800,000",
    intro: "You need to be 50 or over, and show one of these three every year.",
    columns: ["Route", "Amount", "How it works"],
    rows: [
      { label: "Money in a Thai bank", value: "฿800,000", valueSub: "About £18,000 or $24,500", note: "In the account 2 months before you apply and 3 after, then never below ฿400,000" },
      { label: "Monthly income", value: "฿65,000", valueSub: "About £1,460 or $2,000", note: "Proved with an embassy income letter or Thai bank statements" },
      { label: "A combination", value: "฿800,000", valueSub: "A year in total", note: "12 months of income plus savings in a Thai bank. One to do with an agent" },
    ],
    pointsTitle: "Which retirement visa",
    points: [
      "Non-O: extended a year at a time at Jomtien immigration. What most retirees use",
      "O-A: the same money, shown before you arrive",
      "O-X: 10 years, but about ฿3 million",
      "You can't work on a retirement visa",
    ],
    source: "Rules as of November 2026. A guide, not legal advice: check the current rules or use an agent.",
    alt: "Infographic: the money you need for a Thai retirement visa in 2026. Age 50 or over. ฿800,000 in a Thai bank (about £18,000 or $24,500), or ฿65,000 a month income (about £1,460 or $2,000), or a combination adding up to ฿800,000 a year.",
  },
  ninety: {
    id: "ninety",
    file: "thailand-90-day-report-dates",
    path: "/articles/tm30-and-90-day-report-pattaya",
    eyebrow: "Thai visa admin · 2026",
    title: "The 90-day report, made simple",
    big: "Every 90 days",
    intro: "For anyone staying on a long-stay visa: retirement, marriage, education or DTV.",
    columns: ["What", "When or how much", "What to know"],
    rows: [
      { label: "Reporting opens", value: "15 days", valueSub: "before the due date", note: "Online, at Jomtien immigration with a TM47 form, or through an agent" },
      { label: "Reporting closes", value: "7 days", valueSub: "after the due date", note: "After that you're late" },
      { label: "Cost of reporting", value: "Free", note: "It isn't an extension. It just confirms your address" },
      { label: "Late fine", value: "฿2,000", note: "More if you're caught without having reported at all" },
      { label: "The clock resets", value: "Every entry", note: "Your next report is due 90 days after you land" },
      { label: "Re-entry permit", value: "฿1,000", valueSub: "or ฿3,800 multiple", note: "Leave without one and your extension is cancelled" },
    ],
    pointsTitle: "Two more dates",
    points: [
      "TM30 is your landlord's job: get the receipt on move-in day",
      "Start your yearly extension about six weeks early",
    ],
    source: "As of November 2026. Rules change, so check with immigration or your agent.",
    alt: "Infographic: the Thai 90-day report made simple. Report from 15 days before to 7 days after the due date, online, at Jomtien immigration or through an agent. It's free; the late fine is ฿2,000. The count restarts every time you enter Thailand. Re-entry permit ฿1,000, or ฿3,800 for multiple.",
  },
  lease: {
    id: "lease",
    file: "thailand-30-year-lease-explained",
    path: "/questions/is-a-30-year-lease-safe-in-thailand",
    eyebrow: "Buying in Thailand · 2026",
    title: "Thailand's 30-year lease: what you actually get",
    big: "30 years, not 30+30",
    intro: "A lease is registered on the back of the Chanote title deed at the Land Office.",
    columns: ["Part", "How safe", "What it means"],
    rows: [
      { label: "The first 30 years", value: "Protected", note: "Stays on the title if the land is sold or the owner dies" },
      { label: "The “+30” renewal", value: "A promise", note: "In the contract, not registered. Price it as 30 years and nothing more" },
      { label: "An unregistered lease", value: "3 years", note: "Anything longer only counts if it's registered" },
      { label: "Registering it", value: "1.1%", valueSub: "of the total rent", note: "1% fee plus 0.1% stamp duty: about ฿55,000 on ฿5 million" },
      { label: "The real cost", value: "÷ 30", note: "฿5 million is about ฿167,000 a year, or ฿13,900 a month" },
    ],
    pointsTitle: "Check before you pay",
    points: [
      "The owner and a full Chanote, at the Land Office",
      "No mortgage or debt registered against the land",
      "Registered on the day you pay, with your own lawyer",
    ],
    source: "As of November 2026. A guide, not legal advice: get your own lawyer and a second opinion.",
    alt: "Infographic: Thailand's 30-year lease explained. The registered 30 years are protected and stay on the Chanote if the land is sold or the owner dies. The +30 renewal is only a promise in the contract. Registration costs 1% plus 0.1% stamp duty, about ฿55,000 on a ฿5 million lease.",
  },
  areas: {
    id: "areas",
    file: "where-to-live-in-pattaya-areas",
    path: "/areas",
    eyebrow: "Pattaya areas · 2026",
    title: "Where to live in Pattaya",
    big: "Six areas, one city",
    intro: "Typical rent for a one-bed condo, and who each area really suits.",
    columns: ["Area", "1-bed rent", "Best for"],
    rows: [
      { label: "Wongamat & Naklua", value: "฿22,000", note: "Newer high-rises, walking distance to Terminal 21" },
      { label: "Central Pattaya", value: "฿20,000", note: "Young singles who want the buzz and don't want to drive" },
      { label: "Pratumnak", value: "฿22,000", note: "Couples who want quiet without being far out" },
      { label: "Jomtien", value: "฿18,000", note: "Retired couples and beach lovers who want more space" },
      { label: "Na Jomtien & Bang Saray", value: "More space", valueSub: "for ฿20,000", note: "People happy to drive who'd like a village feel" },
      { label: "East Pattaya", value: "฿15,000", note: "Families, pet owners, and anyone who wants a house" },
    ],
    pointsTitle: "Worth knowing",
    points: [
      "Got a pet? Few condos allow them, so look at houses in East Pattaya",
      "No car? Central and Wongamat are the easiest places to live without one",
    ],
    source: "Typical monthly rents, 2026, from my Pattaya cost of living calculator.",
    alt: "Infographic: where to live in Pattaya, six areas with one-bed condo rents. Wongamat and Naklua ฿22,000, Central Pattaya ฿20,000, Pratumnak ฿22,000, Jomtien ฿18,000, Na Jomtien and Bang Saray more space for ฿20,000, East Pattaya ฿15,000.",
  },
};

export const posterImage = (p: Poster, size: "site" | "pin" = "site") =>
  `${POSTERS_DIR}/${p.file}${size === "pin" ? "-pinterest.jpg" : ".webp"}`;

/** Copy-paste HTML another site can use, with a credit link back to the page. */
export const posterEmbedCode = (p: Poster) =>
  `<a href="${SITE}${p.path}"><img src="${SITE}${posterImage(p)}" alt="${p.alt.replace(/"/g, "&quot;")}" width="1080" height="1350" style="max-width:100%;height:auto" /></a>\n<p>Infographic by <a href="${SITE}${p.path}">Shane Ruddle</a>, shaneruddle.com</p>`;

export const POSTER_BY_PATH: Record<string, Poster> = Object.fromEntries(Object.values(POSTERS).map((p) => [p.path, p]));

/** ImageObject structured data for a poster (Google Images credit and licence info). */
export const posterSchema = (p: Poster) => ({
  "@context": "https://schema.org",
  "@type": "ImageObject",
  name: p.title,
  description: p.alt,
  contentUrl: SITE + posterImage(p),
  url: SITE + p.path,
  width: 1080,
  height: 1350,
  encodingFormat: "image/webp",
  creditText: "Shane Ruddle, shaneruddle.com",
  copyrightNotice: "© Shane Ruddle",
  creator: { "@type": "Person", "@id": `${SITE}/#person`, name: "Shane Ruddle", url: SITE },
});
