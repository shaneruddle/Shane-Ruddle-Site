import { MapPin } from "lucide-react";
import { SOCIAL_LINKS } from "./socialLinks";
import PageHero from "./PageHero";
import AskShane from "./AskShane";

// /contact — the Ask Shane flow: questions about moving, buying, renting or doing business in Pattaya, plus partnerships and press.

export default function ContactPage() {
  return (
    <div className="bg-paper text-ink">
      <PageHero
        eyebrow="Contact"
        title={<>Ask me <span className="italic text-gold">anything.</span></>}
        intro="Thinking of moving to Pattaya, buying property, retiring here or starting a business? After 20+ years and seven businesses, I've probably been there. Ask me and I'll reply personally."
      />
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-8">
            <div className="flex gap-3 text-black/70">
              <MapPin className="w-5 h-5 mt-0.5 text-gold-deep shrink-0" />
              <p>Pattaya City, Chon Buri, Thailand</p>
            </div>
            <p className="text-black/60 leading-relaxed">
              For bookings, viewings or reservations, it's quickest to contact{" "}
              <a href="/businesses" className="text-gold-deep hover:text-ink underline underline-offset-4">the business directly</a>.
            </p>
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep mb-4">Follow</h2>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-11 h-11 rounded-full border border-black/15 flex items-center justify-center hover:border-gold-deep hover:text-gold-deep transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="p-8 md:p-10 bg-cream border border-cream-line rounded-[2rem]">
              <AskShane source="contact_page" showHeading={false} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
