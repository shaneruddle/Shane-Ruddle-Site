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
  values: string[];
  ownerPhotos?: string[];
  notificationEmail?: string;
}

// Public homepage content. Bundled statically so the homepage never waits on Firestore.
// Images live in /public/images (optimised WebP). Edit here to change homepage copy.
export const fallbackData: BusinessInfo = {
  name: "Shane Ruddle",
  tagline: "Building businesses that create lasting value for both people and places.",
  about: "Originally from the UK and a former PGA professional golfer, Shane Ruddle is a Pattaya-based entrepreneur with over two decades of experience in Thailand. He is the owner of Alan Bolton Property Consultants and East Coast Real Estate, overseeing a diverse business portfolio that spans real estate, hospitality, car rentals, and tech. He is also a vocal advocate for professionalizing the Thai real estate industry through national licensing and ethical standards.",
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
      logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738212884463x913848644166320500/Hemingways_Logo_Jomtien.png",
      url: "https://www.hemingwaysjomtien.com"
    },
    {
      name: "Hemingways Pattaya",
      description: "The classic Hemingways experience in central Pattaya.",
      services: ["International Dining", "Craft Cocktails", "Live Sports", "Central Location"],
      icon: "Hotel",
      logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738212870086x950453333007466100/Hemingways_Logo_Pattaya.png",
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
      logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1738212991154x209166829233646600/PRAC-Logo-2.png",
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
      logo: "https://6022e9b060237f7418814624aea7f151.cdn.bubble.io/f1754730947495x779512689180206200/LOGO-Square%202016%203.5x3.jpg",
      url: "https://www.thaiproperty.com"
    }
  ],
  values: ["Trust", "Local Expertise", "People-First Approach", "Accountability", "Professionalism", "Lasting Value"],
  // [0] portrait, [1] friends, [2] sports, [3] team, [4] family
  ownerPhotos: [
    "/images/shane-portrait.webp",
    "/images/life-friends.webp",
    "/images/life-sports.webp",
    "/images/life-team.webp",
    "/images/life-family.webp"
  ]
};
