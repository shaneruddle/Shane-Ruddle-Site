// "Selling a business in Pattaya" landing page at /business-in-pattaya/sell-your-business.
// Shane buys Pattaya businesses, and so do owners he knows. The page gives sellers the reasons to
// tell him first and his confidentiality promise, with a second call to action for buyers.

import { BUSINESS_PATH } from "./businessCheck";

export const SELL_PATH = `${BUSINESS_PATH}/sell-your-business`;

export const SELL_META = {
  title: "Sell Your Business in Pattaya Quietly: I Buy Businesses | Shane Ruddle",
  description:
    "Thinking of selling a bar, restaurant, guesthouse or other business in Pattaya? I buy businesses, and so do owners I know. Tell me in confidence: no listing, no agent, and nobody hears about it without your OK.",
};

export const REASONS: { title: string; text: string }[] = [
  {
    title: "I'm a real buyer",
    text: "I own seven businesses in Pattaya and bought most of them rather than starting them. You're talking to the person who decides and pays, not an agent collecting listings.",
  },
  {
    title: "Your sale stays quiet",
    text: "No Facebook post, no listing site, no sign in the window. Your staff, customers, landlord and competitors don't find out you're selling while you're still trading.",
  },
  {
    title: "More than one buyer",
    text: "If it isn't right for me, I know other owners here who buy businesses. With your permission, and only then, I can put it in front of the ones it suits.",
  },
  {
    title: "A straight answer on price",
    text: "I'll tell you what I'd pay and why, based on the profit, the lease and how long you've traded. The rules I use are on this site, so there are no games.",
  },
  {
    title: "No agent, no listing fee",
    text: "You deal with me directly. Nothing to sign up for, nothing to pay to find out whether there's interest.",
  },
  {
    title: "I know how a handover works",
    text: "The lease and the landlord, the Thai company, the licences, the staff. I've taken over enough businesses here to make it smooth for you and the people who work for you.",
  },
];

export const PROMISE: string[] = [
  "I read every message myself. Nobody else sees it.",
  "I won't tell anyone your business is for sale, including the buyers I know, unless you say yes first.",
  "I won't contact your staff, your landlord, your customers or your suppliers.",
  "I'll never post about it or name your business anywhere, on this site or off it.",
  "You don't have to name the business in your first message. Tell me the type, the area and the rough numbers.",
  "If you'd like a confidentiality agreement before you show me the books, I'll sign one.",
  "If you change your mind, tell me and I'll delete what you sent.",
];

export const STEPS: { title: string; text: string }[] = [
  { title: "Tell me the basics", text: "The type of business, the area, roughly what it makes and what you'd like for it. No name needed yet." },
  { title: "I reply personally", text: "Usually within a couple of days, with an honest view of whether it's something I'd buy." },
  { title: "We look at the numbers", text: "If it's a fit, we meet and go through the accounts, the lease and the staff, in confidence." },
  { title: "An offer or an introduction", text: "I make you an offer, or, if you agree, I introduce you to an owner I know who's a better fit." },
];

export const WHAT_TO_SEND: string[] = [
  "Type of business and area",
  "How long it's been trading",
  "Rough profit a year",
  "What you'd like for it",
  "Years left on the lease",
  "Why you're selling",
];

export const WHAT_I_BUY = {
  yes: [
    "Restaurants and bars with a track record",
    "Guesthouses and small hotels",
    "Service businesses: rentals, agencies, cafes",
    "Businesses with Thai customers as well as tourists",
    "Ones where the staff want to stay on",
  ],
  no: ["Walking Street venues, go-go bars and nightclubs", "Lease-only sales with no trading history", "Anything that only works with the owner behind the bar"],
};

export const SELL_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "Do I have to tell you the name of my business?",
    a: "No. Start with the type of business, the area and the rough numbers. If it sounds like a fit, I'll ask for more, and you decide when to share it.",
  },
  {
    q: "Will you tell anyone my business is for sale?",
    a: "No. I don't mention it to anyone, including the buyers I know, unless you've said yes. I never contact your staff, landlord or customers.",
  },
  {
    q: "How do you work out what to pay?",
    a: "Mostly on profit: two to four times a year's profit, depending on how long it has traded, plus the lease, the landlord and whether the staff stay. I explain the rules in my article on valuing a business.",
    href: "/articles/valuing-a-business-in-pattaya",
  },
  {
    q: "What if you don't want to buy it?",
    a: "I'll tell you straight. If you agree, I'll pass it to an owner I know who might, and if you don't, that's the end of it.",
  },
  {
    q: "Do you charge anything?",
    a: "No. I'm a buyer, not an agent. There's no fee to tell me about your business.",
  },
  {
    q: "What kind of businesses do you buy?",
    a: "Restaurants, bars, guesthouses and service businesses with a trading history. I don't buy Walking Street venues, go-go bars or nightclubs.",
  },
];

/** Note added to the message so Shane can tell a seller from a buyer in his inbox. */
export const SELL_CONTEXT = "Enquiry: SELLING a business (sent from the sell-your-business page, confidential)";
export const BUY_CONTEXT = "Enquiry: WANTS TO BUY a business (sent from the sell-your-business page)";
