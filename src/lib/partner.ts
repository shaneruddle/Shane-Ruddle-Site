// "Business partner wanted" landing page at /partner, for Shane's Facebook ad. The venue is kept
// anonymous on purpose. Not linked from the site and kept out of search (noindex, not in the sitemap):
// visitors arrive from the ad. Enquiries go through /api/contact, so they reach Shane by email and the
// portal Enquiries tab.

export const PARTNER_PATH = "/partner";

export const PARTNER_META = {
  title: "Business Partnership Opportunity in Pattaya | Shane Ruddle",
  description:
    "An established Pattaya hospitality business with a large, well-equipped venue is looking for a business partner. Tell me about yourself in confidence.",
};

export const PARTNER_TOPIC = "Business partner";

export const VENUE_POINTS = [
  { title: "Established and trading", text: "A going concern with a name, customers and staff. Not a start-up, and not an empty shell." },
  { title: "A large, well-equipped venue", text: "Plenty of space and excellent facilities, already fitted out and in use." },
  { title: "A great location", text: "Well placed in the Pattaya area. The exact details come once we've spoken." },
  { title: "Room to grow", text: "Considerable potential for further development. That's where the right partner comes in." },
];

export const LOOKING_FOR = [
  "Hospitality or business experience you can put to work",
  "Ideas to move the business forward, and the drive to carry them out",
  "Investment capital, or resources and contacts that make a real difference",
  "Real enthusiasm for the business, the same as mine",
  "Someone who would rather join an established business than start from scratch",
];

export const PARTNER_STEPS = [
  { title: "Fill in the form", text: "It takes about five minutes. The more you tell me, the better." },
  { title: "I read every one myself", text: "If it looks like a fit, I'll get back to you personally." },
  { title: "We talk in private", text: "The business, the numbers and the possible structures are discussed privately with interested parties." },
];

export const BRING_OPTIONS = [
  { id: "capital", label: "Investment capital" },
  { id: "experience", label: "Hospitality experience" },
  { id: "management", label: "Day-to-day management" },
  { id: "marketing", label: "Marketing and events" },
  { id: "contacts", label: "Contacts, suppliers or customers" },
  { id: "ideas", label: "Ideas for development" },
];

export const CAPITAL_OPTIONS = [
  { id: "none", label: "No capital, I'd bring skills or time" },
  { id: "under-1m", label: "Under ฿1 million" },
  { id: "1-3m", label: "฿1 to 3 million" },
  { id: "3-5m", label: "฿3 to 5 million" },
  { id: "5-10m", label: "฿5 to 10 million" },
  { id: "over-10m", label: "Over ฿10 million" },
];

export const EXPERIENCE_OPTIONS = [
  { id: "none", label: "None in hospitality" },
  { id: "worked", label: "I've worked in hospitality" },
  { id: "managed", label: "I've managed a bar, restaurant or hotel" },
  { id: "owned", label: "I've owned one" },
];

export const INVOLVEMENT_OPTIONS = [
  { id: "hands-on", label: "Hands-on, most days" },
  { id: "part-time", label: "Part-time or strategic" },
  { id: "investor", label: "Investor, not involved day to day" },
];

export const WHERE_OPTIONS = [
  { id: "pattaya", label: "I live in Pattaya" },
  { id: "thailand", label: "Elsewhere in Thailand" },
  { id: "moving", label: "Abroad, planning to move here" },
  { id: "abroad", label: "Abroad, staying abroad" },
];

export const TIMING_OPTIONS = [
  { id: "now", label: "Ready now" },
  { id: "3-6", label: "Within 3 to 6 months" },
  { id: "later", label: "Later, I'm exploring" },
];

export const FUNDS_OPTIONS = [
  { id: "yes", label: "Yes" },
  { id: "na", label: "Not applicable, I'm not investing cash" },
  { id: "no", label: "No" },
];
