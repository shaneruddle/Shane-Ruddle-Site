// Welcome email sequences, one per type of visitor. A visitor joins a sequence when they email
// themselves a result from one of the tools (see server/leads.ts). The daily run in
// .github/workflows/sequences.yml sends whatever is due.
//
// A sequence only sends once Shane has approved its emails: set `approved: true`.
// Until then, people still join it and simply wait at the first email.
//
// Email bodies: paragraphs separated by a blank line, links written as [text](url).
// "Hi <first name>," is added automatically, and the sign-off and unsubscribe link are added at the end.
// `day` is days after they signed up.

export type Segment = "moving" | "retiring" | "property" | "business" | "visiting" | "work";

export type SequenceEmail = { day: number; subject: string; body: string };

const S = "https://shaneruddle.com";
const utm = (url: string, segment: string) => `${url}${url.includes("?") ? "&" : "?"}utm_source=shaneruddle.com&utm_medium=email&utm_campaign=welcome_${segment}`;

export const SEQUENCES: Partial<Record<Segment, { approved: boolean; emails: SequenceEmail[] }>> = {
  moving: {
    approved: false,
    emails: [
      {
        day: 1,
        subject: "What I wish I'd known before moving here",
        body: `Thanks for using my tools yesterday. I'm Shane. I came to Pattaya around 20 years ago, started as a bar manager, and now run seven businesses here.

Over the next week or so I'll send you a few short emails with the things I tell friends who are thinking of moving here. No sales pitch, just what I've learned.

The first one is the most honest thing I've written: [what I wish I'd known before moving to Thailand](${S}/articles/what-i-wish-id-known-before-moving-to-thailand). It covers the real downsides too, like visas, banking and health insurance, because it's better to know them up front.

If you have a question about your own plans, just ask me on the site and I'll reply personally.`,
      },
      {
        day: 3,
        subject: "Where would I live if I moved here today?",
        body: `The question I get asked most is which area to live in. The honest answer is that it depends on how you'll spend your days.

Here's my take on each area: [the best area to live in Pattaya](${S}/articles/best-area-to-live-in-pattaya). If you haven't tried it yet, my [area finder](${S}/areas) matches you to an area in four questions.

My advice is always the same: rent before you buy. Live in an area for a while before you commit to anything. [Renting a condo in Pattaya](${S}/articles/renting-a-condo-in-pattaya) explains how it works and what to watch for.

When you're ready to look, my team at East Coast Real Estate has [rentals across Pattaya](${utm("https://www.thaiproperty.com/", "moving")}).`,
      },
      {
        day: 6,
        subject: "Your first month, in the order I'd do it",
        body: `The first few weeks are when most newcomers make the expensive mistakes. Not big ones, just lots of small ones.

I've written up [your first month in Pattaya](${S}/articles/first-month-in-pattaya) in the order I'd do things: SIM card, bank account, getting around, and finding your feet.

Two things people underestimate: [healthcare](${S}/articles/healthcare-in-pattaya), because you pay at the counter, and [making friends](${S}/articles/making-friends-in-pattaya), because it's what decides whether you stay.

If you'd like the whole thing laid out for you, my [move planner](${S}/move-to-thailand) builds a month-by-month plan from six questions.`,
      },
      {
        day: 10,
        subject: "One more thing before you go",
        body: `This is the last of these welcome emails. From now on you'll just get my weekly email.

If you're coming over soon, a car makes the first few weeks much easier, for viewing condos, schools or areas outside the centre. My car rental company, [Pattaya Rent a Car](${utm("https://pattayarentacar.com/", "moving")}), delivers free to your hotel or condo. And if you're unsure about a car or a scooter, I wrote about [which one I'd choose](${S}/articles/scooter-or-car-in-pattaya).

Whatever stage you're at, my door's open. Ask me anything on the site and I'll reply personally.`,
      },
    ],
  },

  retiring: {
    approved: false,
    emails: [
      {
        day: 1,
        subject: "Retiring to Pattaya: the honest version",
        body: `Thanks for using my tools yesterday. I'm Shane. I've lived in Pattaya for around 20 years and run seven businesses here.

Over the next week or so I'll send you a few short emails with what I'd tell a friend who's thinking of retiring here.

Start with my [guide to retiring in Pattaya](${S}/articles/retiring-in-pattaya). It covers what life is really like, what it costs, and what people get wrong.

If you have a question about your own plans, just ask me on the site and I'll reply personally.`,
      },
      {
        day: 3,
        subject: "The retirement visa, in plain English",
        body: `Most people retiring here use a retirement visa, and it's simpler than it looks once someone explains it.

My [retirement visa page](${S}/thai-visas/retirement-visa) sets out the age and money rules, the difference between the Non-O and the O-A, and how renewing works in Pattaya. If you're not sure it's the right visa for you, my [visa finder](${S}/thai-visas) compares them in six questions.

One tip: don't pay for Thailand Privilege if you already qualify for a retirement visa. It costs a lot more for something you can get far cheaper.`,
      },
      {
        day: 6,
        subject: "What it really costs, healthcare included",
        body: `Two things decide whether retirement here works: your monthly budget and your health cover.

My [cost of living calculator](${S}/cost-of-living-calculator) gives you a real monthly figure for your area and lifestyle, based on what my property companies actually let homes for.

Then read [healthcare in Pattaya](${S}/articles/healthcare-in-pattaya). The private hospitals are very good, but you pay at the counter, and every insurance policy has a limit. Check yours before you come.`,
      },
      {
        day: 10,
        subject: "Rent first, then decide",
        body: `This is the last of these welcome emails. From now on you'll just get my weekly email.

My one piece of advice for anyone retiring here: rent before you buy. Live in an area for a while and you'll learn which one really suits you, and it costs far less than buying in the wrong place.

My team at East Coast Real Estate has [rentals across every area of Pattaya](${utm("https://www.thaiproperty.com/", "retiring")}), and my [area finder](${S}/areas) will help you narrow it down.

Whatever stage you're at, ask me anything on the site and I'll reply personally.`,
      },
    ],
  },

  property: {
    approved: false,
    emails: [
      {
        day: 1,
        subject: "Buying in Pattaya: start here",
        body: `Thanks for using my tools yesterday. I'm Shane. I own two property companies here, Alan Bolton Property Consultants and East Coast Real Estate, so I see a lot of buyers, good decisions and bad ones.

Over the next week or so I'll send you a few short emails on what I'd tell a friend who's thinking of buying.

Start with [buying a condo in Pattaya](${S}/articles/buying-a-condo-in-pattaya). It covers how foreign ownership works, the costs on top of the price, and what to check before you pay a deposit.

If you have a question about a specific property or area, just ask me on the site and I'll reply personally.`,
      },
      {
        day: 3,
        subject: "Condo or house? And what foreigners can own",
        body: `Foreigners can own a condo outright, within the foreign quota. Land is different: you can't own it, so with a house you're usually looking at a lease.

[Buying a house in Pattaya](${S}/articles/buying-a-house-in-pattaya) explains how that works and when it still makes sense.

If you're buying to let, read [renting out your condo](${S}/articles/renting-out-your-condo-in-pattaya) before you choose a building. The building matters more than the unit.`,
      },
      {
        day: 6,
        subject: "Where the market is heading",
        body: `Prices and rents depend a lot on what gets built next: the airport, the rail link, the roads and new condo launches.

I've written up [where I think the Pattaya property market is](${S}/articles/pattaya-property-market), and my [Pattaya future timeline](${S}/pattaya-future) tracks the big projects honestly, including the ones that keep slipping.

If you're comparing areas, my [area finder](${S}/areas) is a quick way to narrow it down.`,
      },
      {
        day: 10,
        subject: "When you're ready to look",
        body: `This is the last of these welcome emails. From now on you'll just get my weekly email.

When you're ready to view, my team at Alan Bolton Property Consultants has [condos and houses for sale across Pattaya](${utm("https://pattaya-property.net/", "property")}). They'll tell you honestly if something isn't right.

And if you're not sure yet, rent first. It's the cheapest way to find the right area.

Ask me anything on the site and I'll reply personally.`,
      },
    ],
  },

  business: {
    approved: false,
    emails: [
      {
        day: 1,
        subject: "Thinking of a business in Pattaya?",
        body: `Thanks for using my tools yesterday. I'm Shane. I started here as a bar manager and now run seven businesses, from bars and restaurants to car rental and property.

Over the next week or so I'll send you a few short emails with what I'd tell a friend who's thinking of starting or buying a business here.

Start with [starting or buying a business in Pattaya](${S}/articles/starting-or-buying-a-business-in-pattaya). It's the honest overview: what works, what doesn't, and the rules for foreigners.

If you have a question about your own idea, just ask me on the site and I'll reply personally.`,
      },
      {
        day: 3,
        subject: "Buying a business: what the seller won't tell you",
        body: `Buying a running business can be a smart shortcut, or the most expensive mistake you make here. The difference is the checks you do before you pay.

My [deal checker](${S}/business-in-pattaya/buying-a-business) tests a real listing against the rules I use myself, and [valuing a business in Pattaya](${S}/articles/valuing-a-business-in-pattaya) explains what a fair price looks like.

The lease matters as much as the business. Read [business leases and landlords](${S}/articles/business-leases-and-landlords-in-pattaya) before you sign anything.`,
      },
      {
        day: 6,
        subject: "My biggest business failure",
        body: `I've had businesses that didn't work, and I've learned more from them than from the ones that did.

I wrote about [my biggest business failure](${S}/articles/my-biggest-business-failure) and what I'd do differently. If you're thinking of a bar or restaurant, also read [running a restaurant and bar in Pattaya](${S}/articles/running-a-restaurant-and-bar-in-pattaya).`,
      },
      {
        day: 10,
        subject: "Buying or selling, I can help",
        body: `This is the last of these welcome emails. From now on you'll just get my weekly email.

I buy businesses myself, and so do owners I know. If you own a business you'd like to sell, or you're looking to buy one, [tell me in confidence](${S}/business-in-pattaya/sell-your-business). Nobody hears about it without your OK.

And if you're still deciding, my [business reality check](${S}/business-in-pattaya) gives you an honest verdict on your idea in six questions.`,
      },
    ],
  },
};
