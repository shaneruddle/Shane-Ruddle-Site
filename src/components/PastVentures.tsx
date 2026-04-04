import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

interface Venture {
  years: string;
  name: string;
  desc: string;
  progress: string;
  url?: string;
}

const ventures: Venture[] = [
  { years: "Oct 2007 – Feb 2010", name: "Pattaya Job Centre", desc: "Managed an employment service helping Thai nationals connect with job opportunities.", progress: "40%" },
  { years: "Oct 2007 – Apr 2017", name: "Pattaya Guide", desc: "Pocket-sized tourist guide publication for visitors in Pattaya.", progress: "80%" },
  { years: "Apr 2009 – Jul 2012", name: "Fairways Golf Range", desc: "Operated a golf driving range and resort in Pattaya.", progress: "45%" },
  { years: "Jan 2010 – Present", name: "Pattaya Rent a Car", desc: "Owner of a long-standing car and motorbike rental company in Pattaya.", progress: "90%", url: "https://www.pattayarentacar.com/" },
  { years: "Jan 2010 – Jan 2020", name: "Pattaya Amateur Golf Series", desc: "Organised an annual amateur golf tournament series in Pattaya.", progress: "75%" },
  { years: "Jun 2015 – Present", name: "Birdie Thailand", desc: "Co-Founder of a golf app/platform for score tracking and community.", progress: "85%" },
  { years: "Feb 2018 – Present", name: "Hemingways Jomtien", desc: "Owner of the Hemingways restaurant and bar in Jomtien.", progress: "95%", url: "https://www.hemingwaysjomtien.com/" },
  { years: "Mar 2022 – Present", name: "Hemingways Pattaya", desc: "Owner of the central Pattaya venue.", progress: "65%", url: "https://www.hemingwayspattaya.com/" },
  { years: "Sep 2022 – Present", name: "Alan Bolton Property Consultants", desc: "Owner of established real estate consultancy in Pattaya.", progress: "50%", url: "https://www.pattaya-property.net/" },
  { years: "Aug 2023 – Present", name: "Hemingways (Lakeside)", desc: "Owner of lakeside restaurant and bar venue.", progress: "35%", url: "https://www.hemingwayslakeside.com/" },
  { years: "Jun 2024 – Present", name: "Cajun Life Cafe", desc: "Owner of Cajun Life Cafe hospitality brand.", progress: "20%", url: "https://www.cajunlifecafe.com/" },
  { years: "Aug 2025 – Present", name: "East Coast Real Estate", desc: "Owner of real estate agency in the Eastern Seaboard market.", progress: "5%", url: "https://www.thaiproperty.com/" },
];

export default function PastVentures({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-black font-sans selection:bg-gold selection:text-black py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="group flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-black/40 hover:text-gold transition-colors mb-12"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </motion.button>

        <header className="mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase tracking-[0.4em] text-gold mb-4 block"
          >
            A Legacy of Entrepreneurship
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif mb-6"
          >
            Past <span className="italic">Ventures</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-black/60 font-light max-w-2xl"
          >
            A chronological view of businesses and projects previously developed and run by me in Pattaya.
          </motion.p>
        </header>

        <div className="relative pl-0 md:pl-48">
          {/* Vertical Line */}
          <div className="absolute left-0 md:left-[180px] top-0 bottom-0 w-px bg-black/10 hidden md:block" />

          <div className="space-y-12">
            {ventures.map((venture, index) => (
              <motion.div 
                key={venture.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 md:gap-12"
              >
                {/* Year Label */}
                <div className="text-left md:text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-black/40 md:text-black/60">
                    {venture.years}
                  </span>
                </div>

                {/* Dot (Desktop only) */}
                <div className="absolute left-[180px] top-2 w-2 h-2 rounded-full bg-gold -translate-x-1/2 hidden md:block" />

                {/* Card */}
                <div className="glass p-6 rounded-2xl hover:border-gold/30 transition-colors group">
                  <h3 className="text-xl font-serif mb-2 group-hover:text-gold transition-colors">{venture.name}</h3>
                  <p className="text-sm text-black/60 font-light mb-6 leading-relaxed">
                    {venture.desc}
                  </p>

                  {venture.url && (
                    <a 
                      href={venture.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-gold hover:text-gold-dark transition-colors mb-6"
                    >
                      Visit Website <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="relative h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: venture.progress }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="absolute inset-y-0 left-0 bg-gold"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
