// Thai visas: the /thai-visas hub ("which visa is right for me?" finder + comparison) and one page
// per visa at /thai-visas/<slug>. Visas marked `fromShane` are condensed from the article
// thai-visas-in-pattaya; the rest come from official and agency sources and carry a
// "Check before applying" badge. Visa rules change often: keep RULES_AS_OF and the figures in step.

import type { AskTopic } from "../components/AskShane";

export const VISAS_PATH = "/thai-visas";
export const RULES_AS_OF = "October 2026";

/** Articles that show the visa finder card above Ask Shane. */
export const VISA_PROMO_ARTICLES = new Set([
  "thai-visas-in-pattaya",
  "retiring-in-pattaya",
  "pattaya-for-digital-nomads",
  "living-in-pattaya",
  "what-i-wish-id-known-before-moving-to-thailand",
  "starting-or-buying-a-business-in-pattaya",
  "international-schools-in-pattaya",
]);

export type VisaId = "exempt" | "dtv" | "retirement" | "privilege" | "ltr" | "business" | "marriage" | "education";

export interface VisaFaq {
  q: string;
  a: string;
}

export interface ThaiVisa {
  id: VisaId;
  slug: string;
  name: string;
  /** Official name(s). */
  official: string;
  tagline: string;
  metaTitle: string;
  description: string;
  /** Covered in Shane's own article. Everything else shows "Check before applying". */
  fromShane: boolean;
  glance: { stay: string; money: string; cost: string; work: string };
  /** Short line used in the finder result: why this visa fits. */
  fit: string;
  intro: string[];
  /** Shane's own words, from the article. Only on fromShane visas. */
  take?: string;
  suits: string[];
  requirements: string[];
  steps: string[];
  watch: string[];
  faqs: VisaFaq[];
  articles: string[];
  askTopic: AskTopic;
  /** Official page to check before applying. */
  officialUrl?: { label: string; url: string };
}

export const VISAS: ThaiVisa[] = [
  {
    id: "retirement",
    slug: "retirement-visa",
    name: "Retirement visa",
    official: "Non-Immigrant O (retirement), O-A and O-X",
    tagline: "For anyone 50 or over who can show the money",
    metaTitle: "Thailand Retirement Visa 2026: ฿800,000 Rule, O vs O-A",
    description:
      "Thailand retirement visa requirements for 2026: age 50+, ฿800,000 in a Thai bank or ฿65,000 a month. Non-O vs O-A vs O-X, and renewing it in Pattaya.",
    fromShane: true,
    glance: {
      stay: "1 year at a time, renewed here",
      money: "฿800,000 in a Thai bank, ฿65,000 a month income, or a mix",
      cost: "฿1,900 for each yearly extension",
      work: "No",
    },
    fit: "you're 50 or over and can show ฿800,000 or ฿65,000 a month",
    intro: [
      "Retirees use a retirement visa. The two most people use are the Non-Immigrant O, which you get and then extend every year here in Pattaya, and the O-A, which you apply for from your home country.",
      "You need to be 50 or over and prove you have enough money: ฿800,000 in a Thai bank account, an income of ฿65,000 a month, or a combination of the two.",
    ],
    take: "As Thai visas go, it's relatively simple. Once you can prove the money, it's pretty straightforward. Even so, I'd always use an agent. There are plenty around the city, and they make the whole experience a lot less painful.",
    suits: [
      "You're 50 or over and plan to live here most of the year",
      "You have savings or a pension you can show",
      "You don't need to work in Thailand",
    ],
    requirements: [
      "Aged 50 or over",
      "฿800,000 in a Thai bank account, or ฿65,000 a month income, or a combination of the two",
      "The deposit usually has to be in the account 2 months before you apply and stay there 3 months after, then not drop below ฿400,000 (check before applying)",
      "Passport with at least 6 months left, photos and proof of your Pattaya address",
      "For the O-A only: health insurance meeting the embassy's minimum cover, a police check and a medical certificate (check before applying)",
    ],
    steps: [
      "Get a Non-Immigrant O visa from a Thai embassy, or apply for the O-A from home",
      "Open a Thai bank account and move the money in early, so it has been there long enough",
      "Apply for the one-year extension at the immigration office in Jomtien (฿1,900)",
      "Report your address every 90 days (in person, by post or online)",
      "Get a re-entry permit before you travel: ฿1,000 single or ฿3,800 multiple",
      "Repeat the extension every year",
    ],
    watch: [
      "Leaving Thailand without a re-entry permit cancels your extension",
      "Don't pay for Thailand Privilege if you already qualify for a retirement visa",
      "You can't work on a retirement visa. If you might start a business, plan for a Non-B later",
      "There's also the O-X, a 10-year retirement visa for some nationalities with much higher money requirements (check before applying)",
    ],
    faqs: [
      {
        q: "How much money do I need for a Thai retirement visa?",
        a: "฿800,000 in a Thai bank account, or an income of ฿65,000 a month, or a combination of the two (as of October 2026). You also need to be 50 or over.",
      },
      {
        q: "What's the difference between the Non-O and the O-A?",
        a: "You apply for the O-A from your home country, and it needs health insurance and more paperwork up front. With the Non-O you come here, then extend it for a year at a time at immigration in Pattaya.",
      },
      {
        q: "Should I use a visa agent for my retirement visa?",
        a: "I would. There are plenty around Pattaya, and they make the whole experience a lot less painful.",
      },
    ],
    articles: ["thai-visas-in-pattaya", "retiring-in-pattaya", "banking-in-thailand-for-foreigners", "healthcare-in-pattaya"],
    askTopic: "retiring",
    officialUrl: { label: "Thai e-Visa (official)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "dtv",
    slug: "dtv-visa",
    name: "DTV (Destination Thailand Visa)",
    official: "Destination Thailand Visa (DTV)",
    tagline: "Five years for remote workers, with 180-day stays",
    metaTitle: "DTV Visa Thailand 2026: Digital Nomad Visa Rules and the Catch",
    description:
      "The Destination Thailand Visa (DTV) explained by a 20-year Pattaya resident: 5 years, 180 days per entry, ฿500,000 savings, the August 2026 changes, and the catch.",
    fromShane: true,
    glance: {
      stay: "5 years, up to 180 days per entry",
      money: "About ฿500,000 in savings",
      cost: "About ฿10,000 (set by each embassy)",
      work: "Remote work for clients abroad only",
    },
    fit: "you work online and want long stays without a Thai employer",
    intro: [
      "For people working online there's the DTV, the Destination Thailand Visa. It lasts five years, with stays of up to 180 days per entry, and you need to show around ฿500,000 in savings.",
      "It also covers people coming for 'soft power' activities such as Muay Thai, Thai cooking courses or medical treatment, and a spouse and children can come as dependants (check before applying).",
    ],
    take: "Understand what it is, though: it's essentially a long-term tourist visa. Even though it can last up to five years, you're still classed as a tourist, not an immigrant, so things like opening a bank account can be a problem, depending on the bank.",
    suits: [
      "Remote workers, freelancers and digital nomads",
      "Under-50s who want to spend long stretches here",
      "People doing a long course such as Muay Thai or Thai cooking",
    ],
    requirements: [
      "About ฿500,000 in savings, usually held for around 3 months (check before applying)",
      "Proof of remote work (an employment contract or your own company abroad), or enrolment in a qualifying activity",
      "Since 31 August 2026: proof you live in the country you apply from, and a criminal record certificate (check before applying)",
      "Passport with at least 6 months left",
    ],
    steps: [
      "Apply online through the official Thai e-Visa site from the country you live in",
      "Enter Thailand and stay up to 180 days",
      "Extend once for another 180 days at the immigration office in Jomtien, or leave and come back for a new 180 days",
      "Report your address every 90 days if you stay that long in one go",
    ],
    watch: [
      "You can't work for a Thai company or run a business here on a DTV",
      "Some banks won't open an account for you on a tourist-class visa",
      "Spend 180 days or more here in a year and you become tax resident, so foreign income you bring in can be taxable (check with an accountant)",
    ],
    faqs: [
      {
        q: "How much money do I need for the DTV?",
        a: "Around ฿500,000 in savings (as of October 2026). Embassies usually want to see it held for a few months.",
      },
      {
        q: "Can I work in Thailand on a DTV?",
        a: "Only remotely, for clients or an employer outside Thailand. You can't work for a Thai company or run a business here.",
      },
      {
        q: "What's the catch with the DTV?",
        a: "It's essentially a long-term tourist visa. You're classed as a tourist, not an immigrant, so things like opening a bank account can be a problem, depending on the bank.",
      },
    ],
    articles: ["thai-visas-in-pattaya", "pattaya-for-digital-nomads", "banking-in-thailand-for-foreigners"],
    askTopic: "visa",
    officialUrl: { label: "Thai e-Visa (official)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "privilege",
    slug: "thailand-privilege-visa",
    name: "Thailand Privilege (Elite)",
    official: "Thailand Privilege Card (formerly Thailand Elite)",
    tagline: "Pay once, skip most of the paperwork, but you can't work",
    metaTitle: "Thailand Privilege (Elite) Visa 2026: Prices and Who It Suits",
    description:
      "Thailand Privilege (formerly Elite) visa prices for 2026, from ฿650,000 for 5 years, and the costly mistake a friend of mine made with it. From a Pattaya business owner.",
    fromShane: true,
    glance: {
      stay: "5 to 20 years, depending on the package",
      money: "No savings test, you pay a membership fee",
      cost: "From ฿650,000 for 5 years",
      work: "No",
    },
    fit: "you'd rather pay once than deal with yearly paperwork",
    intro: [
      "Thailand Privilege, which used to be called the Elite visa, is a membership you buy. There's no age or savings test, and once you've paid there's very little admin or hassle.",
      "Packages start at ฿650,000 for five years. Other packages run to 10, 15 and 20 years for more money (check before applying).",
    ],
    take: "Someone I know bought an Elite visa. It cost him close to a million baht. Then he decided he wanted to work. Thailand Privilege isn't a work visa, and there was no way to convert it into a business visa, so he had to walk away from it. It was a complete waste of money. Think about what you might want to do here in a few years, not just now.",
    suits: [
      "Under-50s who want to stay long term without working",
      "People who'll pay to avoid yearly renewals and bank deposits",
      "Anyone who's sure they won't want to work here",
    ],
    requirements: [
      "Membership fee: about ฿650,000 (5 years), ฿900,000 (5 years), ฿1.5m (10 years), ฿2.5m (15 years), ฿5m (20 years) (check before applying)",
      "The cheapest 5-year package may close to new members at the end of 2026 (check before applying)",
      "Passport and a background check by the operator",
      "No age, income or savings requirement",
    ],
    steps: [
      "Apply through Thailand Privilege Card Co. or one of its authorised agents",
      "Pay the fee once you're approved",
      "Get the visa stamped and enter Thailand",
      "Report your address every 90 days (members get help with this)",
    ],
    watch: [
      "It's not a work visa and can't be converted into one",
      "If you're 50 or over and can show ฿800,000, a retirement visa costs a fraction of this",
      "The fee isn't refundable if your plans change",
    ],
    faqs: [
      {
        q: "How much does Thailand Privilege cost?",
        a: "Packages start at ฿650,000 for five years (as of October 2026), with longer packages for more money.",
      },
      {
        q: "Can I work on a Thailand Privilege visa?",
        a: "No. It isn't a work visa, and it can't be converted into a business visa. If you might want to work, it's the wrong choice.",
      },
      {
        q: "Is Thailand Privilege worth it?",
        a: "Only if you're sure you won't want to work, and you don't qualify for something cheaper. I know someone who paid close to a million baht, then had to walk away from it when he wanted to work.",
      },
    ],
    articles: ["thai-visas-in-pattaya", "what-i-wish-id-known-before-moving-to-thailand"],
    askTopic: "visa",
    officialUrl: { label: "Thailand Privilege (official)", url: "https://www.thailandprivilege.co.th/" },
  },
  {
    id: "business",
    slug: "business-visa-work-permit",
    name: "Business visa and work permit",
    official: "Non-Immigrant B with a work permit",
    tagline: "The one you need to work or run a business here",
    metaTitle: "Thailand Work Visa and Work Permit 2026: The Non-B Business Visa Explained | Shane Ruddle",
    description:
      "The Non-Immigrant B visa and work permit, from a Pattaya business owner who's been on one for 20 years: who needs it, what the company needs, and how renewals work.",
    fromShane: true,
    glance: {
      stay: "1 year at a time, while you have the job",
      money: "The company has to qualify, not you",
      cost: "Varies. Most people pay an agent",
      work: "Yes, with the work permit",
    },
    fit: "you want to work for a Thai company or run your own business here",
    intro: [
      "The Non-Immigrant B is the business visa, and it's what you need to work in Thailand. It runs alongside your work permit, and both are tied to the company you work for.",
      "If you start your own business here, your company employs you and gets your work permit. The company usually needs ฿2 million in registered capital and four Thai employees for each foreign worker (check before applying).",
    ],
    take: "I'm on a Non-Immigrant B visa. It's always been easy for me, because I've used the same agent for the last 20 years. She's still in business, I pay her, and she does it for me.",
    suits: [
      "Anyone with a job offer from a Thai company",
      "People starting or buying a business in Pattaya",
      "Anyone who thinks they might want to work here in a few years",
    ],
    requirements: [
      "A Thai employer, or your own Thai company, that will employ you",
      "Usually ฿2 million registered capital and 4 Thai staff per foreign employee (check before applying)",
      "Company documents, your contract, qualifications and a medical certificate",
      "A work permit from the Department of Employment",
    ],
    steps: [
      "Get the job offer, or set up your company first",
      "Apply for a Non-Immigrant B visa at a Thai embassy (or change your visa here through an agent)",
      "Apply for the work permit once you're in Thailand",
      "Extend for a year at a time at the immigration office in Jomtien",
      "Report your address every 90 days",
    ],
    watch: [
      "The visa ends if the job ends, so changing employer means new paperwork",
      "Don't work on any other visa, including the DTV and Thailand Privilege",
      "A good agent saves a lot of time. I've used the same one for 20 years",
    ],
    faqs: [
      {
        q: "Which visa do I need to work in Thailand?",
        a: "A Non-Immigrant B (business) visa, which runs alongside a work permit.",
      },
      {
        q: "Can I run my own business in Pattaya on a business visa?",
        a: "Yes. Your Thai company employs you and applies for your work permit. Read my guide to starting or buying a business in Pattaya first.",
      },
      {
        q: "Can I switch from Thailand Privilege to a business visa?",
        a: "No. There's no way to convert it, so if you might want to work, don't start on Thailand Privilege.",
      },
    ],
    articles: ["thai-visas-in-pattaya", "starting-or-buying-a-business-in-pattaya", "hiring-foreign-staff-in-pattaya"],
    askTopic: "business",
  },
  {
    id: "ltr",
    slug: "ltr-visa",
    name: "LTR (Long-Term Resident)",
    official: "Long-Term Resident (LTR) visa",
    tagline: "Ten years for high earners, wealthy pensioners and skilled professionals",
    metaTitle: "Thailand LTR Visa 2026: 10-Year Visa Requirements Explained Simply | Shane Ruddle",
    description:
      "The Thailand Long-Term Resident (LTR) visa in plain English: 10 years, the four categories, income rules for pensioners and remote workers, and who it actually suits.",
    fromShane: false,
    glance: {
      stay: "10 years (5 + 5)",
      money: "Around US$80,000 a year income, or US$1m in assets",
      cost: "About ฿50,000",
      work: "Yes, with a digital work permit (most categories)",
    },
    fit: "your income or assets are high enough to qualify for 10 years",
    intro: [
      "The LTR is Thailand's 10-year visa for people the government wants to attract. It's run by the Board of Investment, not immigration, and it comes with fewer chores: you report once a year instead of every 90 days.",
      "There are four categories: wealthy global citizens, wealthy pensioners (50+), work-from-Thailand professionals, and highly skilled professionals.",
    ],
    suits: [
      "Pensioners 50+ with around US$80,000 a year in pension or investment income",
      "Remote employees earning around US$80,000 a year from an established company abroad",
      "People with US$1m in assets who'll invest US$500,000 in Thailand",
    ],
    requirements: [
      "Wealthy pensioner: 50+, around US$80,000 a year passive income, or US$40,000 plus a US$250,000 investment in Thailand (check before applying)",
      "Work-from-Thailand professional: around US$80,000 a year from an established employer abroad (check before applying)",
      "Wealthy global citizen: US$1m in assets and a US$500,000 investment in Thailand (check before applying)",
      "Health insurance cover, usually at least US$50,000 (check before applying)",
    ],
    steps: [
      "Check which category you fit on the Board of Investment's LTR site",
      "Apply online and wait for the BOI's qualification letter",
      "Get the visa issued at an embassy or in Thailand",
      "Report once a year, rather than every 90 days",
    ],
    watch: [
      "The income rules are strict, and they're about proof, not estimates",
      "Tax treatment differs between categories (check with an accountant)",
      "If you just about qualify for a retirement visa, that's far simpler",
    ],
    faqs: [
      {
        q: "Who qualifies for the Thailand LTR visa?",
        a: "Wealthy pensioners, well-paid remote workers, wealthy investors and highly skilled professionals. Most categories need around US$80,000 a year in income (check the current rules on the BOI site).",
      },
      {
        q: "Can I work on an LTR visa?",
        a: "Most categories come with a digital work permit. Pensioners need a separate exemption to work (check before applying).",
      },
      {
        q: "LTR or retirement visa?",
        a: "If you're 50+ and comfortably over the LTR's income bar, the LTR saves you yearly renewals. If not, the retirement visa (฿800,000 or ฿65,000 a month) is far simpler.",
      },
    ],
    articles: ["thai-visas-in-pattaya", "retiring-in-pattaya", "pattaya-for-digital-nomads"],
    askTopic: "visa",
    officialUrl: { label: "BOI LTR visa (official)", url: "https://ltr.boi.go.th/" },
  },
  {
    id: "marriage",
    slug: "marriage-visa",
    name: "Marriage visa",
    official: "Non-Immigrant O (married to a Thai national)",
    tagline: "For anyone married to a Thai, at any age",
    metaTitle: "Thailand Marriage Visa 2026: ฿400,000 Rule and Renewing in Pattaya | Shane Ruddle",
    description:
      "The Thai marriage visa (Non-O based on marriage) explained: ฿400,000 or ฿40,000 a month, the paperwork, home visits, and renewing it every year in Pattaya.",
    fromShane: false,
    glance: {
      stay: "1 year at a time, renewed here",
      money: "฿400,000 in a Thai bank, or ฿40,000 a month income",
      cost: "฿1,900 for each yearly extension",
      work: "Yes, with a work permit",
    },
    fit: "you're married to a Thai, which halves the money you need to show",
    intro: [
      "If you're married to a Thai national you can stay on a Non-Immigrant O based on your marriage, at any age. The money you need to show is half what a retiree needs.",
      "It's extended a year at a time at immigration, and unlike a retirement visa you can get a work permit on it.",
    ],
    suits: [
      "Anyone legally married to a Thai national",
      "Under-50s who don't qualify for a retirement visa",
      "People who might want to work here",
    ],
    requirements: [
      "A marriage registered in Thailand, or a foreign marriage registered at the district office (check before applying)",
      "฿400,000 in a Thai bank account, or ฿40,000 a month income (check before applying)",
      "Your spouse's ID card and house registration, and photos of you together at home",
      "Immigration may visit your home to check you live together",
    ],
    steps: [
      "Register your marriage and translate the documents",
      "Get a Non-Immigrant O visa, then apply for the one-year extension at the immigration office in Jomtien (฿1,900)",
      "Go to the appointment together with your spouse",
      "Report your address every 90 days and get a re-entry permit before you travel",
    ],
    watch: [
      "The money is usually checked before and after each renewal",
      "Leaving without a re-entry permit cancels your extension",
    ],
    faqs: [
      {
        q: "How much money do I need for a Thai marriage visa?",
        a: "฿400,000 in a Thai bank account or an income of ฿40,000 a month (as of October 2026, check before applying).",
      },
      {
        q: "Can I work on a Thai marriage visa?",
        a: "Yes, with a work permit. That's one of the big advantages over a retirement visa.",
      },
      {
        q: "Is there an age limit for the marriage visa?",
        a: "No. Unlike the retirement visa, there's no minimum age.",
      },
    ],
    articles: ["thai-visas-in-pattaya", "cultural-mistakes-in-thailand", "banking-in-thailand-for-foreigners"],
    askTopic: "visa",
    officialUrl: { label: "Thai e-Visa (official)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "education",
    slug: "education-visa",
    name: "Education and guardian visas",
    official: "Non-Immigrant ED, and Non-O (guardian of a student)",
    tagline: "For students, and parents of children at school here",
    metaTitle: "Thailand Education (ED) and Guardian Visa 2026 Explained",
    description:
      "The Thai ED visa for students and the Non-O guardian visa for parents of children at international school in Pattaya: the ฿500,000 rule and how renewals work.",
    fromShane: false,
    glance: {
      stay: "Up to a year at a time, while studying",
      money: "Course fees. Guardians: about ฿500,000 in a Thai bank",
      cost: "School or course fees, plus ฿1,900 per extension",
      work: "No",
    },
    fit: "you're studying here, or bringing your children to school",
    intro: [
      "Students at a Thai university, language school or international school can get an ED visa, sponsored by the school.",
      "When a child is at school here on an ED visa, a parent can usually stay on a Non-O guardian visa, with about ฿500,000 in a Thai bank account (check before applying).",
    ],
    suits: [
      "Families with children at an international school in Pattaya",
      "People who want to learn Thai properly",
      "University students",
    ],
    requirements: [
      "An offer from a school or university that can sponsor the visa",
      "For guardians: about ฿500,000 in a Thai bank account in your name, and the child's school letter (check before applying)",
      "Usually only one guardian visa per child (check before applying)",
      "Language-school students: real attendance, which immigration does check",
    ],
    steps: [
      "Enrol, and get the school's visa documents",
      "Apply for the ED visa (and the guardian Non-O) at a Thai embassy, or through the school",
      "Extend at the immigration office in Jomtien as the course or school year continues",
      "Report your address every 90 days",
    ],
    watch: [
      "Language-school ED visas get scrutiny. Immigration may test your Thai",
      "You can't work on an ED or guardian visa",
    ],
    faqs: [
      {
        q: "What visa does a parent need if their child goes to school in Pattaya?",
        a: "Usually a Non-O guardian visa, based on the child's ED visa, with about ฿500,000 in a Thai bank account (check the current rules with the school).",
      },
      {
        q: "Can I get a visa to learn Thai?",
        a: "Yes. Licensed language schools can sponsor an ED visa, but you must actually attend, and immigration does check.",
      },
      {
        q: "Can I work on an education visa?",
        a: "No. If you want to work, you'll need a Non-B visa and a work permit.",
      },
    ],
    articles: ["international-schools-in-pattaya", "is-pattaya-good-for-families", "learning-thai"],
    askTopic: "family",
    officialUrl: { label: "Thai e-Visa (official)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "exempt",
    slug: "visa-exemption",
    name: "Visa exemption (30 days)",
    official: "Visa exemption on arrival",
    tagline: "Fine for a holiday or a first look, not for living here",
    metaTitle: "Thailand Visa Exemption Cut to 30 Days (2026): What It Means for Pattaya | Shane Ruddle",
    description:
      "Thailand cut its visa-free stay from 60 to 30 days on 15 September 2026. How long you can stay in Pattaya without a visa, extending it, and the TDAC arrival card.",
    fromShane: false,
    glance: {
      stay: "30 days, plus one 30-day extension",
      money: "None in practice",
      cost: "Free. ฿1,900 to extend",
      work: "No",
    },
    fit: "you only need a month or two",
    intro: [
      "Most Western passports can arrive without a visa. From 15 September 2026 that stay was cut from 60 days to 30 for most countries (check before applying).",
      "You can usually extend once, by up to 30 days, at the immigration office in Jomtien. Before you fly, fill in the online Thailand Digital Arrival Card (TDAC).",
    ],
    suits: [
      "Holidays and a first look at Pattaya before you move",
      "Viewing property or meeting schools before you commit",
    ],
    requirements: [
      "A passport from an eligible country, with at least 6 months left",
      "The online Thailand Digital Arrival Card (TDAC), filled in before you arrive",
      "An onward or return ticket can be asked for",
    ],
    steps: [
      "Fill in the TDAC online in the days before you fly",
      "Get stamped in on arrival for 30 days",
      "If you need longer, extend once at the immigration office in Jomtien (฿1,900)",
    ],
    watch: [
      "Back-to-back visa-free entries get questioned at the border",
      "It's not a way to live here. If you're staying, pick a proper visa before you come",
    ],
    faqs: [
      {
        q: "How long can I stay in Thailand without a visa?",
        a: "For most Western passports, 30 days from 15 September 2026 (it was 60 days before that), plus one extension of up to 30 days. Check your own country's rules before you travel.",
      },
      {
        q: "Can I extend my visa-free stay in Pattaya?",
        a: "Usually once, by up to 30 days, at the immigration office in Jomtien. The fee is ฿1,900.",
      },
      {
        q: "What is the TDAC?",
        a: "The Thailand Digital Arrival Card, an online form every foreign visitor fills in before arriving. It replaced the old paper arrival card.",
      },
    ],
    articles: ["bangkok-airport-to-pattaya", "best-time-to-visit-pattaya", "things-to-do-in-pattaya"],
    askTopic: "visiting",
    officialUrl: { label: "TDAC (official)", url: "https://tdac.immigration.go.th/" },
  },
];

export const visaBySlug = (slug: string) => VISAS.find((v) => v.slug === slug);
export const visaById = (id: VisaId) => VISAS.find((v) => v.id === id)!;

export const VISAS_META = {
  title: "Which Thai Visa Is Right for Me? Free Visa Finder (2026) | Shane Ruddle",
  description:
    "Answer six questions and find the right Thai visa: retirement, DTV, Thailand Privilege, LTR, business, marriage or education. From a Pattaya resident of 20 years.",
};

export const VISAS_FAQS: VisaFaq[] = [
  {
    q: "Which Thai visa is best for living in Pattaya?",
    a: "It depends on your age and what you'll do here. Retirees 50+ use a retirement visa, remote workers use the DTV, and anyone working or running a business needs a Non-B visa with a work permit.",
  },
  {
    q: "What's the biggest visa mistake people make?",
    a: "Getting bad advice, and ending up on a visa that doesn't suit their circumstances. Think about what you might want to do here in a few years, not just now.",
  },
  {
    q: "How long can I stay in Thailand without a visa?",
    a: "For most Western passports, 30 days since 15 September 2026, down from 60. You can usually extend once by up to 30 days.",
  },
  {
    q: "Do I need a visa agent in Pattaya?",
    a: "You don't have to use one, but I always have. There are plenty around the city, and they make the whole experience a lot less painful.",
  },
];

// ---- "Which visa is right for me?" finder ----

export type VisaQuestionId = "purpose" | "age" | "stay" | "money" | "future" | "pay";

export interface VisaQuestion {
  id: VisaQuestionId;
  question: string;
  hint?: string;
  options: { id: string; label: string }[];
}

export const VISA_QUESTIONS: VisaQuestion[] = [
  {
    id: "purpose",
    question: "What's the main reason you're coming?",
    options: [
      { id: "retire", label: "Retiring" },
      { id: "remote", label: "Working online for clients or a company abroad" },
      { id: "work", label: "A job or my own business in Thailand" },
      { id: "spouse", label: "I'm married to a Thai" },
      { id: "school", label: "Studying, or my children are at school here" },
      { id: "holiday", label: "A long holiday, or trying it out" },
    ],
  },
  {
    id: "age",
    question: "How old are you?",
    options: [
      { id: "under50", label: "Under 50" },
      { id: "over50", label: "50 or over" },
    ],
  },
  {
    id: "stay",
    question: "How long do you want to stay?",
    options: [
      { id: "short", label: "A month or two" },
      { id: "half", label: "Up to six months at a time" },
      { id: "long", label: "A year or more. I'm moving here" },
    ],
  },
  {
    id: "money",
    question: "What could you show in savings or income?",
    hint: "Roughly. Most visas test one or the other.",
    options: [
      { id: "low", label: "Under ฿500,000" },
      { id: "mid", label: "฿500,000 to ฿800,000" },
      { id: "high", label: "฿800,000+ or ฿65,000 a month" },
      { id: "wealthy", label: "US$80,000+ a year, or US$1m in assets" },
    ],
  },
  {
    id: "future",
    question: "Might you want to work or start a business here in the next few years?",
    hint: "This is the question most people forget.",
    options: [
      { id: "yes", label: "Yes" },
      { id: "maybe", label: "Maybe" },
      { id: "no", label: "No" },
    ],
  },
  {
    id: "pay",
    question: "Would you pay ฿650,000 or more to skip most of the paperwork?",
    options: [
      { id: "yes", label: "Yes, if it saves the hassle" },
      { id: "no", label: "No, I'd rather do the paperwork" },
    ],
  },
];

export type VisaAnswers = Partial<Record<VisaQuestionId, string>>;

export interface VisaResult {
  best: ThaiVisa;
  runnerUp: ThaiVisa;
  /** Personal warnings drawn from the answers. */
  notes: string[];
}

// Rule-based, so every outcome can be explained. Order matters: the first matching rule wins.
export function recommendVisa(a: VisaAnswers): VisaResult {
  const over50 = a.age === "over50";
  const rich = a.money === "wealthy";
  const has800 = a.money === "high" || rich;
  const has500 = a.money !== "low";
  const pay = a.pay === "yes";
  const longStay = a.stay === "long";
  let best: VisaId;
  let runner: VisaId;

  if (a.purpose === "work") {
    best = "business";
    runner = rich ? "ltr" : a.stay === "short" ? "exempt" : "dtv";
  } else if (a.stay === "short") {
    best = "exempt";
    runner = a.purpose === "spouse" ? "marriage" : over50 && has800 ? "retirement" : "dtv";
  } else if (a.purpose === "spouse") {
    best = "marriage";
    runner = over50 && has800 ? "retirement" : "dtv";
  } else if (a.purpose === "school") {
    best = "education";
    runner = pay ? "privilege" : "dtv";
  } else if (a.purpose === "retire") {
    if (over50 && has800) {
      best = "retirement";
      runner = rich ? "ltr" : pay ? "privilege" : "dtv";
    } else if (over50) {
      best = pay ? "privilege" : has500 ? "dtv" : "retirement";
      runner = best === "retirement" ? "dtv" : "retirement";
    } else {
      best = pay ? "privilege" : "dtv";
      runner = pay ? "dtv" : "education";
    }
  } else if (a.purpose === "remote") {
    best = rich ? "ltr" : "dtv";
    runner = rich ? "dtv" : pay && longStay ? "privilege" : over50 && has800 ? "retirement" : "exempt";
  } else {
    // Long holiday or trying it out.
    if (longStay && pay) {
      best = "privilege";
      runner = over50 && has800 ? "retirement" : "dtv";
    } else {
      best = over50 && has800 && longStay ? "retirement" : "dtv";
      runner = best === "dtv" ? (over50 && has800 ? "retirement" : "exempt") : "dtv";
    }
  }

  const notes: string[] = [];
  const wantsWork = a.future === "yes" || a.future === "maybe";
  if (wantsWork && best !== "business" && best !== "ltr" && best !== "marriage") {
    notes.push(
      best === "privilege" || runner === "privilege"
        ? "You said you might want to work or start a business here. Thailand Privilege can't be converted into a work visa. I know someone who paid close to a million baht and had to walk away from it."
        : "You said you might want to work for a Thai company or start a business here. This visa doesn't allow that, so when the time comes you'll need a Non-B visa and a work permit through a Thai company."
    );
  }
  if (pay && over50 && has800 && best === "retirement") {
    notes.push("You'd pay to skip the paperwork, but you qualify for a retirement visa at ฿1,900 a year. With a good agent there's very little hassle.");
  }
  if ((best === "dtv" || (best === "retirement" && !has800)) && a.money === "low") {
    notes.push(
      best === "dtv"
        ? "The DTV needs around ฿500,000 in savings, so you'd need to build that up first."
        : "A retirement visa needs ฿800,000 in a Thai bank or ฿65,000 a month income, so you'd need to build that up first."
    );
  }
  if ((best === "retirement" || runner === "retirement") && !has800 && a.money === "mid") {
    notes.push("You're short of the ฿800,000 for a retirement visa. A mix of savings and monthly income can count, so ask before you rule it out.");
  }

  return { best: visaById(best), runnerUp: visaById(runner === best ? "exempt" : runner), notes };
}

/** Plain-text summary of the answers, sent with an Ask Shane question. */
export function visaAnswersSummary(answers: VisaAnswers, result: VisaResult) {
  const lines = VISA_QUESTIONS.map((q) => `${q.question} ${q.options.find((o) => o.id === answers[q.id])?.label ?? "-"}`);
  return `Visa finder answers:\n${lines.join("\n")}\nSuggested: ${result.best.name} (runner-up ${result.runnerUp.name})`;
}
