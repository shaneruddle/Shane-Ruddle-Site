export interface Company {
  name: string;
  description: string;
  services: string[];
  icon?: string;
  logo?: string;
  url?: string;
}

export interface BusinessInfo {
  name: string;
  tagline: string;
  about: string;
  companies: Company[];
  values: { title: string; text: string }[];
  ownerPhotos?: string[];
  notificationEmail?: string;
}

// Public homepage content. Bundled statically so the homepage never waits on Firestore.
// Images live in /public/images (optimised WebP). Edit here to change homepage copy.
export const fallbackData: BusinessInfo = {
  name: "Shane Ruddle",
  tagline: "I've spent over 20 years building businesses in Pattaya. These days I own seven of them, and I write about what's worked, what hasn't, and what I've learned along the way.",
  about: "I'm originally from the UK and a former PGA professional golfer. I came to Pattaya over 20 years ago, and my first job was managing the Sportsman bar in Soi 13. Since then I've started, bought and sold a long list of businesses, from a pocket tourist guide to a golf range that taught me to do my numbers properly. Today I own two real estate agencies, four restaurants and bars, and a car rental company that's been running since 2010. I'm also a vocal advocate for professionalising Thai real estate through national licensing and proper ethical standards.",
  companies: [
    {
      name: "Hemingways Lakeside",
      description: "Pattaya's premier lakeside dining experience.",
      services: ["Lakeside Views", "Family Friendly", "Garden Seating", "Private Events"],
      icon: "Hotel",
      logo: "/images/logo-hemingways-lakeside.webp",
      url: "https://www.hemingwayslakeside.com"
    },
    {
      name: "Hemingways Jomtien",
      description: "Beachfront dining and drinks in Jomtien.",
      services: ["Beachfront Dining", "Seafood Specialties", "Sunset Lounge", "Relaxed Vibe"],
      icon: "Hotel",
      logo: "/images/logo-hemingways-jomtien.webp",
      url: "https://www.hemingwaysjomtien.com"
    },
    {
      name: "Hemingways Pattaya",
      description: "The classic Hemingways experience in central Pattaya.",
      services: ["International Dining", "Craft Cocktails", "Live Sports", "Central Location"],
      icon: "Hotel",
      logo: "/images/logo-hemingways-pattaya.webp",
      url: "https://www.hemingwayspattaya.com"
    },
    {
      name: "Cajun Life Cafe",
      description: "Authentic Cajun flavors in the heart of Thailand.",
      services: ["Cajun Cuisine", "Specialty Coffee", "Live Music", "Community Hub"],
      icon: "Sparkles",
      logo: "/images/logo-cajun-life-cafe.webp",
      url: "https://www.cajunlifecafe.com"
    },
    {
      name: "Pattaya Rent a Car",
      description: "Reliable car rental services in Pattaya.",
      services: ["Car Rental", "Short-term Rentals", "Long-term Leasing", "Airport Delivery"],
      icon: "Car",
      logo: "/images/logo-prac.webp",
      url: "https://www.pattayarentacar.com"
    },
    {
      name: "Alan Bolton Property Consultants",
      description: "Expert real estate advice and property management.",
      services: ["Property Sales", "Rentals", "Investment Consulting", "Property Management"],
      icon: "Home",
      logo: "/images/logo-abpc.webp",
      url: "https://www.pattaya-property.net"
    },
    {
      name: "East Coast Real Estate",
      description: "Leading real estate agency on the Eastern Seaboard.",
      services: ["Property Sales", "Market Analysis", "Investment Advice", "Relocation Services"],
      icon: "Home",
      logo: "/images/logo-ecre.webp",
      url: "https://www.thaiproperty.com"
    }
  ],
  values: [
    { title: "Trust runs both ways.", text: "At Pattaya Rent a Car we hand customers the keys to a ฿600,000 car for a ฿10,000 deposit. Referrals and returning customers are the backbone of every business I run." },
    { title: "People stay.", text: "My best foreign managers have been with me five years or more, and the ones who stay share in the profits." },
    { title: "Be here, and pay attention.", text: "Almost every business I've bought came through someone I knew or something I heard in the right room." },
    { title: "Keep cash in reserve.", text: "It's why Pattaya Rent a Car came out of COVID with more cars, not fewer." },
    { title: "Do the numbers.", text: "My golf range taught me that passion isn't a business plan." },
    { title: "Raise the standard.", text: "East Coast Real Estate was named The Best Agent in Pattaya in 2026, and I push for licensing so buyers here get proper protection." },
  ],
  // [0] portrait, [1] friends, [2] sports, [3] team, [4] family
  ownerPhotos: [
    "/images/shane-portrait.webp",
    "/images/life-friends.webp",
    "/images/life-sports.webp",
    "/images/life-team.webp",
    "/images/life-family.webp"
  ]
};
