import { MapPin } from "lucide-react";
import { SOCIAL_LINKS } from "./socialLinks";
import PageHero from "./PageHero";
import ContactForm from "./ContactForm";

// /contact — partnerships, investors and press. Business enquiries are pointed at each company's own site.

export default function ContactPage() {
  return (
    <div className="bg-paper text-ink">
      <PageHero
        eyebrow="Contact"
        title={<>Get in <span className="italic text-gold">touch.</span></>}
        intro="For partnerships, investment, press or speaking. For bookings, viewings or reservations, contact the business directly through its own website."
      />
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5 space-y-8">
            <div className="flex gap-3 text-black/70">
              <MapPin className="w-5 h-5 mt-0.5 text-gold-deep shrink-0" />
              <p>Pattaya City, Chon Buri, Thailand</p>
            </div>
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
            <ContactForm dark={false} />
          </div>
        </div>
      </section>
    </div>
  );
}
