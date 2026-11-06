// "Moving to Thailand from <country>" pages (/move-to-thailand/from-the-uk etc.): what changes for a
// reader coming from that country (pension, tax, healthcare, banking, driving, flights) plus their
// costs in their own currency. Costs come from calculate() so they match the calculator.
// Pension and tax rules are from official and adviser sources, not Shane's own articles, and change
// often: keep COUNTRY_RULES_AS_OF in step, and every page carries a "check before you act" note.

import type { AskTopic } from "../components/AskShane";
import { CALCULATOR_PATH, CostInputs, Currency, DEFAULT_INPUTS, calculate, formatBaht, formatMoney, inputsToQuery } from "./costOfLiving";
import { MOVE_PATH } from "./movePlan";

export const COUNTRY_RULES_AS_OF = "November 2026";
export const countryPath = (slug: string) => `${MOVE_PATH}/${slug}`;

export type CountryId = "uk" | "us" | "au";

export interface CountrySection {
  id: string;
  title: string;
  paras: string[];
  /** Short do-this-before-you-go points. */
  points?: string[];
  links?: { label: string; href: string }[];
}

export interface CountryGuide {
  id: CountryId;
  slug: string;
  /** "the UK", used in sentences. */
  name: string;
  /** "UK", used on buttons and chips. */
  short: string;
  flag: string;
  currency: Currency;
  metaTitle: string;
  description: string;
  h1: string;
  tagline: string;
  glance: { label: string; value: string }[];
  /** Shane's own words. Only where he has said it himself. */
  take?: { quote: string; caption: string };
  sections: CountrySection[];
  /** "Before you leave" checklist. */
  checklist: string[];
  faqs: { q: string; a: string }[];
  articles: string[];
  askTopic: AskTopic;
  official: { label: string; url: string }[];
}

const money = (baht: number, c: Currency) => `${formatMoney(baht, c)} (${formatBaht(baht)})`;

/** Three typical households, priced with the calculator, for the "what it costs" block. */
export function sampleBudgets(currency: Currency) {
  const profiles: { label: string; sub: string; inputs: CostInputs }[] = [
    {
      label: "Living lean, on your own",
      sub: "1-bed condo in East Pattaya, mostly cooking, Grab and baht buses",
      inputs: { ...DEFAULT_INPUTS, area: "east", food: "cook", transport: "grab", goingOut: false, currency },
    },
    {
      label: "Comfortable, on your own",
      sub: "1-bed condo in Jomtien, eating out and in, a rented motorbike",
      inputs: { ...DEFAULT_INPUTS, food: "mix", currency },
    },
    {
      label: "A retired couple, 50+",
      sub: "2-bed condo in Jomtien, a long-term rental car, health insurance",
      inputs: { ...DEFAULT_INPUTS, household: "couple", home: "condo2", food: "mix", transport: "carRent", health: "insured50", currency },
    },
  ];
  return profiles.map((p) => {
    const total = calculate(p.inputs).total;
    return { ...p, total, main: formatMoney(total, currency), baht: formatBaht(total), href: CALCULATOR_PATH + inputsToQuery(p.inputs) };
  });
}

const VISA = "/thai-visas";
/** "Comfortable, on your own" from sampleBudgets, for the FAQ answers. */
const comfortable = (c: Currency) => sampleBudgets(c)[1].main;

export const COUNTRIES: CountryGuide[] = [
  {
    id: "uk",
    slug: "from-the-uk",
    name: "the UK",
    short: "UK",
    flag: "/images/flags/gb.svg",
    currency: "GBP",
    metaTitle: "Moving to Thailand from the UK (2026): Pension, Tax, NHS and Visas | Shane Ruddle",
    description:
      "Moving or retiring to Thailand from the UK: the frozen State Pension, the 2026 National Insurance change, Thai tax on money you bring in, the NHS, visas and what Pattaya costs in pounds.",
    h1: "Moving to Thailand from the UK",
    tagline: "I made the same move from England over 20 years ago. Here's what changes for a Brit, and what to sort out before you go.",
    glance: [
      { label: "Flight", value: "About 12 hours nonstop from London" },
      { label: "Without a visa", value: "30 days, extendable once" },
      { label: "State Pension", value: "Paid, but frozen" },
      { label: "Tax treaty", value: "Yes, UK–Thailand" },
    ],
    take: {
      quote:
        "A couple of years ago, my son needed treatment while we were in the UK, and we spent most of the day waiting to see a doctor. Here, you'd be in and out in an hour. In the UK the treatment was free and here you pay, but given the choice, I'd pay every time.",
      caption: "Shane, from Living in Pattaya",
    },
    sections: [
      {
        id: "visa",
        title: "Which visa a Brit uses",
        paras: [
          "A British passport gets you 30 days on arrival without a visa, and you can extend once by up to 30 days at the immigration office in Jomtien. That's fine for a look around, not for living here.",
          `If you're 50 or over, most Brits use the retirement visa. You need ${money(800000, "GBP")} in a Thai bank, or an income of ${money(65000, "GBP")} a month, or a mix. If you work online for UK clients or a UK employer, look at the DTV. The visa finder will tell you which fits.`,
        ],
        links: [
          { label: "Retirement visa", href: `${VISA}/retirement-visa` },
          { label: "DTV for remote workers", href: `${VISA}/dtv-visa` },
          { label: "Take the visa finder", href: VISA },
        ],
      },
      {
        id: "pension",
        title: "Your State Pension will be frozen",
        paras: [
          "You can be paid your UK State Pension in Thailand, but it's frozen. Thailand has no agreement with the UK that includes the yearly increase, so you get the rate you were on when you left (or when you first claimed, if you claim from here) and it never goes up. Over a 20-year retirement that adds up to a lot of money.",
          "From 6 April 2026 you can no longer pay the cheap voluntary Class 2 National Insurance for years abroad. Only Class 3 is left, at about £18 a week, and new applicants need 10 years of UK residence or contributions. If you have gaps in your record, check your forecast and decide before you go.",
        ],
        points: [
          "Get your State Pension forecast on gov.uk.",
          "Claim through the International Pension Centre once you live here.",
          "Workplace and private pensions aren't frozen. Ask your provider about paying abroad.",
        ],
      },
      {
        id: "tax",
        title: "Tax: what changed in 2024",
        paras: [
          "Once you spend 180 days or more in Thailand in a calendar year, you're a Thai tax resident. Since 1 January 2024, foreign income you earn and then bring into Thailand can be taxed here. Savings you built up before 2024 aren't caught. An exemption for money brought in within a year has been talked about but, as of late 2026, it isn't law.",
          "The UK–Thailand double tax agreement stops you paying twice on the same income. UK government pensions (civil service, armed forces and police, for example) are normally taxed only in the UK. Tell HMRC you've left with form P85, and get proper advice before you move a large sum.",
        ],
      },
      {
        id: "health",
        title: "The NHS won't cover you here",
        paras: [
          "Once you move abroad you lose your automatic right to free NHS care, and there's no agreement with Thailand. You'll need private health insurance, and if you're on an O-A retirement visa it's compulsory. Get it before you need it, because pre-existing conditions get harder to cover the older you are.",
          "The good news is the private hospitals here are very good, and you're seen quickly.",
        ],
        links: [{ label: "Healthcare in Pattaya", href: "/articles/healthcare-in-pattaya" }],
      },
      {
        id: "money",
        title: "Banking and moving money",
        paras: [
          "Keep a UK current account and a UK address you can use, because some banks close accounts when you move abroad. Most people send money over with a transfer service rather than their bank, then open a Thai account once they have a visa.",
        ],
        links: [{ label: "Banking in Thailand", href: "/articles/banking-in-thailand-for-foreigners" }],
      },
      {
        id: "driving",
        title: "Driving",
        paras: [
          "Thailand drives on the left, like the UK, which makes life easier. Bring your photocard licence and get an International Driving Permit (the 1949 kind) before you leave. Once you're living here, get a Thai licence: it's quick, and the police take it more seriously.",
        ],
        links: [
          { label: "Getting a Thai driving licence", href: "/articles/thai-driving-licence" },
          { label: "Driving in Pattaya", href: "/articles/driving-in-pattaya" },
        ],
      },
      {
        id: "getting-here",
        title: "Getting here",
        paras: [
          "There are nonstop flights from London to Bangkok Suvarnabhumi, about 11 to 12 hours. From the airport it's around two hours to Pattaya by road. Pattaya is seven hours ahead of the UK in winter and six in summer, so if you still work for UK clients, your day starts after lunch.",
        ],
        links: [{ label: "Bangkok airport to Pattaya", href: "/articles/bangkok-airport-to-pattaya" }],
      },
      {
        id: "people",
        title: "Meeting other Brits",
        paras: [
          "Pattaya has one of the biggest British communities in Asia, so you won't be short of company. I own the three Hemingways, which are sports bars with British pub food and live Premier League, and plenty of newcomers start there. Just don't only mix with other Brits.",
        ],
        links: [
          { label: "Watching football in Pattaya", href: "/articles/watching-football-in-pattaya" },
          { label: "Making friends in Pattaya", href: "/articles/making-friends-in-pattaya" },
        ],
      },
    ],
    checklist: [
      "Check your State Pension forecast and any National Insurance gaps",
      "Tell HMRC you're leaving (form P85)",
      "Keep a UK bank account and a UK address you can use",
      "Get health insurance in place before you fly",
      "Get an International Driving Permit",
      "Get a UK police check if your visa or job needs one",
      "Fill in the Thailand Digital Arrival Card (TDAC) before you fly",
    ],
    faqs: [
      {
        q: "Can I move to Thailand from the UK?",
        a: "Yes. Most Brits who live here are on a retirement visa (50 and over), a DTV if they work online, or a business visa and work permit if they work for a Thai company. Without a visa you get 30 days, extendable once.",
      },
      {
        q: "Is the UK State Pension frozen in Thailand?",
        a: "Yes. It's paid, but you don't get the yearly increase, because Thailand has no agreement with the UK that includes it. You stay on the rate you had when you left or first claimed.",
      },
      {
        q: "How much money do I need to retire in Thailand from the UK?",
        a: `For the retirement visa you need ${money(800000, "GBP")} in a Thai bank, or ${money(65000, "GBP")} a month income, or a mix. To live, a comfortable single life in Pattaya is around ${comfortable("GBP")} a month.`,
      },
      {
        q: "Will I pay tax in Thailand on my UK pension?",
        a: "If you're a Thai tax resident (180+ days a year), private pension income earned from 2024 and brought into Thailand can be taxed here. UK government pensions are normally taxed only in the UK under the double tax agreement. Get advice for your situation.",
      },
      {
        q: "Can I still use the NHS if I live in Thailand?",
        a: "Not automatically. Once you live abroad you're no longer entitled to free NHS care, so you need private health insurance here.",
      },
    ],
    articles: ["retiring-in-pattaya", "what-i-wish-id-known-before-moving-to-thailand", "is-pattaya-expensive", "best-area-to-live-in-pattaya"],
    askTopic: "retiring",
    official: [
      { label: "State Pension if you retire abroad (gov.uk)", url: "https://www.gov.uk/state-pension-if-you-retire-abroad" },
      { label: "Voluntary National Insurance (gov.uk)", url: "https://www.gov.uk/voluntary-national-insurance-contributions" },
      { label: "Living in Thailand (gov.uk)", url: "https://www.gov.uk/guidance/living-in-thailand" },
    ],
  },
  {
    id: "us",
    slug: "from-the-usa",
    name: "the USA",
    short: "USA",
    flag: "/images/flags/us.svg",
    currency: "USD",
    metaTitle: "Moving to Thailand from the USA (2026): Visas, Social Security, Taxes, Medicare | Shane Ruddle",
    description:
      "Moving or retiring to Thailand from the US: which visa Americans use, Social Security in Thailand, US and Thai tax (FEIE, FBAR, the 2024 rule), Medicare, flights and what Pattaya costs in dollars.",
    h1: "Moving to Thailand from the USA",
    tagline: "What changes for an American moving to Pattaya: your visa, your Social Security, two tax systems, and what life here costs in dollars.",
    glance: [
      { label: "Flight", value: "17 to 24 hours, one stop" },
      { label: "Without a visa", value: "30 days, extendable once" },
      { label: "Social Security", value: "Paid in full, with increases" },
      { label: "Tax treaty", value: "Yes, US–Thailand" },
    ],
    sections: [
      {
        id: "visa",
        title: "Which visa an American uses",
        paras: [
          "A US passport gets you 30 days on arrival without a visa, and you can extend once by up to 30 days at the immigration office in Jomtien. To live here you need a proper visa.",
          `If you're 50 or over, the retirement visa is the usual route: ${money(800000, "USD")} in a Thai bank, or an income of ${money(65000, "USD")} a month, or a mix. Remote workers with US clients or employers look at the DTV. With more money, the LTR or Thailand Privilege visas save you the yearly paperwork.`,
        ],
        links: [
          { label: "Retirement visa", href: `${VISA}/retirement-visa` },
          { label: "DTV for remote workers", href: `${VISA}/dtv-visa` },
          { label: "LTR visa", href: `${VISA}/ltr-visa` },
          { label: "Take the visa finder", href: VISA },
        ],
      },
      {
        id: "pension",
        title: "Social Security keeps paying",
        paras: [
          "Unlike the British, Americans keep their full Social Security in Thailand, including the yearly cost-of-living increases. Under the US–Thailand tax treaty, US Social Security paid to someone living here is taxed only by the US, so bringing it into Thailand shouldn't add Thai tax.",
          "401(k) and IRA withdrawals are different: they can be taxed in both countries, with a credit for tax already paid. Get advice before you move a large sum.",
        ],
        points: [
          "Set up your my Social Security account before you leave.",
          "Keep a US bank account for deposits and US bills.",
        ],
      },
      {
        id: "tax",
        title: "Two tax systems",
        paras: [
          "The US taxes its citizens wherever they live, so you keep filing a US return every year. If you work here, the Foreign Earned Income Exclusion lets you leave out up to $132,900 of earned income for 2026 (not pensions or investment income). If your foreign accounts add up to more than $10,000 at any point in the year, you also file an FBAR.",
          "On the Thai side, once you spend 180 days or more here in a calendar year you're a Thai tax resident, and since 2024 foreign income you bring into Thailand can be taxed here. Savings from before 2024 aren't caught. A US expat tax adviser is worth paying for in your first year.",
        ],
      },
      {
        id: "health",
        title: "Medicare doesn't work here",
        paras: [
          "Medicare doesn't cover you in Thailand, so you'll need international health insurance. Think carefully before dropping Medicare Part B: if you sign up again later, there's a permanent late-enrollment penalty.",
          "Private hospitals in Pattaya are very good, and much cheaper than in the US.",
        ],
        links: [{ label: "Healthcare in Pattaya", href: "/articles/healthcare-in-pattaya" }],
      },
      {
        id: "money",
        title: "Banking and moving money",
        paras: [
          "Some Thai banks ask Americans for extra US tax paperwork when you open an account, so take your passport, visa and proof of address and be patient. Keep your US account and send money over with a transfer service rather than wire fees from your bank.",
        ],
        links: [{ label: "Banking in Thailand", href: "/articles/banking-in-thailand-for-foreigners" }],
      },
      {
        id: "driving",
        title: "Driving on the left",
        paras: [
          "Thailand drives on the left, which takes Americans a week or two to get used to. Get an International Driving Permit from AAA before you leave, then switch to a Thai licence once you live here.",
        ],
        links: [
          { label: "Getting a Thai driving licence", href: "/articles/thai-driving-licence" },
          { label: "Driving in Pattaya", href: "/articles/driving-in-pattaya" },
        ],
      },
      {
        id: "getting-here",
        title: "Getting here",
        paras: [
          "There are no regular nonstop flights from the US mainland to Bangkok, so you'll connect, usually in Tokyo, Seoul, Taipei, Hong Kong or the Gulf. Allow 17 to 24 hours door to Bangkok, then two hours by road to Pattaya. Thailand is 11 to 12 hours ahead of New York and 14 to 15 ahead of California, so remote workers often work evenings.",
        ],
        links: [{ label: "Bangkok airport to Pattaya", href: "/articles/bangkok-airport-to-pattaya" }],
      },
      {
        id: "people",
        title: "Meeting other Americans",
        paras: [
          "The American community here is smaller than the British one, but it's there. One of my businesses, Cajun Life Cafe, was started by Jeff, who's from Louisiana and got stuck here during COVID. If you miss proper Cajun food, that's the place.",
        ],
        links: [
          { label: "Eating healthily in Pattaya", href: "/articles/eating-healthily-in-pattaya" },
          { label: "Making friends in Pattaya", href: "/articles/making-friends-in-pattaya" },
        ],
      },
    ],
    checklist: [
      "Set up your my Social Security account",
      "Line up a US expat tax adviser for your first return",
      "Decide on Medicare Part B before you go",
      "Get international health insurance in place",
      "Get an International Driving Permit from AAA",
      "Keep a US bank account and a US mailing address",
      "Fill in the Thailand Digital Arrival Card (TDAC) before you fly",
    ],
    faqs: [
      {
        q: "Can an American move to Thailand?",
        a: "Yes. Most Americans here use a retirement visa (50 and over), a DTV for remote work, or an LTR or Thailand Privilege visa if they have more money. Without a visa you get 30 days, extendable once.",
      },
      {
        q: "Can I get Social Security in Thailand?",
        a: "Yes, in full and with the yearly cost-of-living increases. Under the US–Thailand tax treaty it's taxed only by the US.",
      },
      {
        q: "Do I still pay US taxes if I live in Thailand?",
        a: "You still file every year, because the US taxes citizens wherever they live. The Foreign Earned Income Exclusion covers up to $132,900 of earned income for 2026, and you file an FBAR if your foreign accounts top $10,000.",
      },
      {
        q: "How much do I need to retire in Thailand from the US?",
        a: `The retirement visa needs ${money(800000, "USD")} in a Thai bank, or ${money(65000, "USD")} a month income, or a mix. A comfortable single life in Pattaya is around ${comfortable("USD")} a month.`,
      },
      {
        q: "Does Medicare cover me in Thailand?",
        a: "No. You need international health insurance. Think before dropping Part B, because rejoining later carries a permanent penalty.",
      },
    ],
    articles: ["retiring-in-pattaya", "working-remotely-in-pattaya", "is-pattaya-expensive", "what-i-wish-id-known-before-moving-to-thailand"],
    askTopic: "retiring",
    official: [
      { label: "Social Security outside the US (ssa.gov)", url: "https://www.ssa.gov/international/payments.html" },
      { label: "US citizens abroad, tax (irs.gov)", url: "https://www.irs.gov/individuals/international-taxpayers/us-citizens-and-resident-aliens-abroad" },
      { label: "US Embassy Bangkok", url: "https://th.usembassy.gov/" },
    ],
  },
  {
    id: "au",
    slug: "from-australia",
    name: "Australia",
    short: "Australia",
    flag: "/images/flags/au.svg",
    currency: "AUD",
    metaTitle: "Moving to Thailand from Australia (2026): Age Pension, Super, Tax and Visas | Shane Ruddle",
    description:
      "Moving or retiring to Thailand from Australia: the Age Pension after 26 weeks, super, the tax traps for non-residents, Medicare, visas, flights and what Pattaya costs in Australian dollars.",
    h1: "Moving to Thailand from Australia",
    tagline: "Short flights, a small time difference and a lot of Aussies already here. Here's what changes for you, and the traps to avoid.",
    glance: [
      { label: "Flight", value: "7 to 9 hours nonstop" },
      { label: "Without a visa", value: "30 days, extendable once" },
      { label: "Age Pension", value: "May drop after 26 weeks" },
      { label: "Tax treaty", value: "Yes, Australia–Thailand" },
    ],
    take: {
      quote: "If your clients are in the UK or US, you might have to start work in the afternoon. You manage it. If you work with Australia, it's hardly an issue.",
      caption: "Shane, from Working remotely in Pattaya",
    },
    sections: [
      {
        id: "visa",
        title: "Which visa an Australian uses",
        paras: [
          "An Australian passport gets you 30 days on arrival without a visa, and you can extend once by up to 30 days at the immigration office in Jomtien.",
          `If you're 50 or over, the retirement visa is the usual route: ${money(800000, "AUD")} in a Thai bank, or an income of ${money(65000, "AUD")} a month, or a mix. If you work online for Australian clients, look at the DTV.`,
        ],
        links: [
          { label: "Retirement visa", href: `${VISA}/retirement-visa` },
          { label: "DTV for remote workers", href: `${VISA}/dtv-visa` },
          { label: "Take the visa finder", href: VISA },
        ],
      },
      {
        id: "pension",
        title: "The Age Pension after 26 weeks",
        paras: [
          "You can keep getting the Age Pension in Thailand, but there's no social security agreement between Australia and Thailand. You have to claim it while you're in Australia, and after 26 weeks abroad it may drop to a proportional rate: if you lived in Australia for less than 35 years of your working life (age 16 to pension age), you get that share of the full rate. Some supplements also reduce.",
          "Your super stays in Australia. You can usually access it from age 60 once you retire. How Thailand treats super withdrawals you bring in is a question for an adviser before you move a lump sum.",
        ],
        points: ["Check your working-life residence years with Services Australia before you go."],
      },
      {
        id: "tax",
        title: "Tax, and the home-sale trap",
        paras: [
          "If you move here for good, you'll usually become a non-resident for Australian tax. Non-residents lose the tax-free threshold, and in most cases the main residence capital gains exemption too, so if you're selling your home, talk to an accountant about timing before you leave.",
          "On the Thai side, once you spend 180 days or more here in a calendar year you're a Thai tax resident, and since 2024 foreign income you bring into Thailand can be taxed here. Savings from before 2024 aren't caught. The Australia–Thailand tax agreement stops you paying twice on the same income.",
        ],
      },
      {
        id: "health",
        title: "Medicare doesn't cover you here",
        paras: [
          "Australia has no reciprocal health agreement with Thailand, so Medicare won't pay for treatment here. You'll need international health insurance, and on an O-A retirement visa it's compulsory.",
          "The private hospitals in Pattaya are very good, and you're seen quickly.",
        ],
        links: [{ label: "Healthcare in Pattaya", href: "/articles/healthcare-in-pattaya" }],
      },
      {
        id: "money",
        title: "Banking and moving money",
        paras: [
          "Keep an Australian account open for your pension and super, and send money over with a transfer service rather than your bank. You can open a Thai account once you have a visa.",
        ],
        links: [{ label: "Banking in Thailand", href: "/articles/banking-in-thailand-for-foreigners" }],
      },
      {
        id: "driving",
        title: "Driving",
        paras: [
          "Thailand drives on the left, like Australia. Get an International Driving Permit from your state motoring club before you leave, then switch to a Thai licence once you live here.",
        ],
        links: [
          { label: "Getting a Thai driving licence", href: "/articles/thai-driving-licence" },
          { label: "Driving in Pattaya", href: "/articles/driving-in-pattaya" },
        ],
      },
      {
        id: "getting-here",
        title: "Getting here",
        paras: [
          "There are nonstop flights to Bangkok from the big Australian cities: about 9 hours from the east coast and 7 from Perth. From the airport it's around two hours to Pattaya by road. Pattaya is 3 to 4 hours behind Sydney and 1 hour behind Perth, so working with Australia from here is easy.",
        ],
        links: [{ label: "Bangkok airport to Pattaya", href: "/articles/bangkok-airport-to-pattaya" }],
      },
      {
        id: "people",
        title: "Meeting other Aussies",
        paras: [
          "There's a big Australian crowd in Pattaya, and a lot of them come for the sport. My three Hemingways are sports bars with plenty of screens, so they're a good first stop to meet people.",
        ],
        links: [
          { label: "Watching sport in Pattaya", href: "/articles/watching-football-in-pattaya" },
          { label: "Making friends in Pattaya", href: "/articles/making-friends-in-pattaya" },
        ],
      },
    ],
    checklist: [
      "Claim the Age Pension before you leave Australia, if you're eligible",
      "Check your working-life residence years with Services Australia",
      "Talk to an accountant about tax residency and selling your home",
      "Get international health insurance in place",
      "Get an International Driving Permit from your motoring club",
      "Keep an Australian bank account open",
      "Fill in the Thailand Digital Arrival Card (TDAC) before you fly",
    ],
    faqs: [
      {
        q: "Can I retire in Thailand from Australia?",
        a: "Yes. If you're 50 or over, most Australians use the retirement visa. Without a visa you get 30 days, extendable once.",
      },
      {
        q: "Can I get the Age Pension in Thailand?",
        a: "Yes, but claim it before you leave. After 26 weeks abroad it may drop to a proportional rate if you lived in Australia for less than 35 years between age 16 and pension age.",
      },
      {
        q: "How much do I need to retire in Thailand from Australia?",
        a: `The retirement visa needs ${money(800000, "AUD")} in a Thai bank, or ${money(65000, "AUD")} a month income, or a mix. A comfortable single life in Pattaya is around ${comfortable("AUD")} a month.`,
      },
      {
        q: "Does Medicare cover me in Thailand?",
        a: "No. There's no reciprocal health agreement with Thailand, so you need international health insurance.",
      },
      {
        q: "How long is the flight from Australia to Thailand?",
        a: "About 9 hours nonstop from Sydney or Melbourne and about 7 from Perth, then two hours by road from Bangkok to Pattaya.",
      },
    ],
    articles: ["retiring-in-pattaya", "is-pattaya-expensive", "best-area-to-live-in-pattaya", "what-i-wish-id-known-before-moving-to-thailand"],
    askTopic: "retiring",
    official: [
      { label: "Retiring overseas (Services Australia)", url: "https://www.servicesaustralia.gov.au/retiring-overseas" },
      { label: "Leaving Australia on the Age Pension", url: "https://www.servicesaustralia.gov.au/when-you-leave-australia-if-you-get-age-pension" },
      { label: "Smartraveller: Thailand", url: "https://www.smartraveller.gov.au/destinations/asia/thailand" },
    ],
  },
];

export const countryBySlug = (slug: string) => COUNTRIES.find((c) => c.slug === slug);
export const countryById = (id: string) => COUNTRIES.find((c) => c.id === id);

/** The "Where are you moving from?" picker: the three guides plus the German edition. */
export const COUNTRY_PICKS: { id: string; label: string; flag: string; href: string }[] = [
  ...COUNTRIES.map((c) => ({ id: c.id, label: c.short, flag: c.flag, href: countryPath(c.slug) })),
  { id: "de", label: "Deutschland", flag: "/images/flags/de.svg", href: "/de/auswandern-nach-pattaya" },
];
