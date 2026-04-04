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
}

export const fallbackData: BusinessInfo = {
  name: "Shane Ruddle",
  tagline: "Shane Ruddle companies: investing in people, places, and potential.",
  about: "I lead a premier group of companies in Pattaya, Thailand, specializing in real estate, luxury car rentals, hospitality, and lifestyle services. With years of local experience, I am dedicated to providing exceptional service and value to clients worldwide.",
  companies: [
    {
      name: "Alan Bolton Property Consultants",
      description: "Pattaya's leading property consultants, offering expert advice on sales, rentals, and investments.",
      services: ["Property Sales", "Luxury Rentals", "Investment Consulting", "Property Management"],
      icon: "Home",
      logo: "input_file_5.png",
      url: "https://www.pattaya-property.net/"
    },
    {
      name: "Pattaya Rent a Car",
      description: "Premium and luxury vehicle rentals providing the best driving experience in Pattaya.",
      services: ["Luxury Car Fleet", "Short-term Rentals", "Long-term Leasing", "Chauffeur Services"],
      icon: "Car",
      logo: "input_file_6.png",
      url: "https://www.pattayarentacar.com/"
    },
    {
      name: "Hemingways Pattaya",
      description: "The flagship restaurant and bar in central Pattaya, known for its vibrant atmosphere and international cuisine.",
      services: ["International Dining", "Craft Cocktails", "Live Sports", "Central Location"],
      icon: "Hotel",
      logo: "input_file_2.png",
      url: "https://www.hemingwayspattaya.com/"
    },
    {
      name: "Hemingways Jomtien",
      description: "A stunning beachfront destination in Jomtien, offering fresh seafood and sunset views.",
      services: ["Beachfront Dining", "Seafood Specialties", "Sunset Lounge", "Relaxed Vibe"],
      icon: "Hotel",
      logo: "input_file_1.png",
      url: "https://www.hemingwaysjomtien.com/"
    },
    {
      name: "Hemingways Lakeside",
      description: "A tranquil dining experience by the lake, perfect for families and peaceful evenings.",
      services: ["Lakeside Views", "Family Friendly", "Garden Seating", "Private Events"],
      icon: "Hotel",
      logo: "input_file_0.png",
      url: "https://www.hemingwayslakeside.com/"
    },
    {
      name: "Cajun Life Cafe",
      description: "Authentic Cajun flavors and a vibrant lifestyle cafe experience in the heart of Pattaya.",
      services: ["Cajun Cuisine", "Specialty Coffee", "Live Music", "Community Hub"],
      icon: "Sparkles",
      logo: "input_file_4.png",
      url: "https://www.cajunlifecafe.com/"
    },
    {
      name: "East Coast Real Estate",
      description: "Owner of real estate agency in the Eastern Seaboard market.",
      services: ["Property Sales", "Market Analysis", "Investment Advice", "Relocation Services"],
      icon: "Home",
      logo: "input_file_3.png",
      url: "https://www.thaiproperty.com/"
    }
  ],
  values: ["Trust", "People-First", "Excellence", "Integrity"],
  ownerPhotos: []
};
