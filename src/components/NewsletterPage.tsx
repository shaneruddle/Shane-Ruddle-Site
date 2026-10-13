import { Check } from "lucide-react";
import PageHero from "./PageHero";
import NewsletterSignup from "./NewsletterSignup";

// /newsletter — the owned-audience sign-up page.

const WHAT_YOU_GET = [
  "The week's most useful article, in full",
  "One insight from running seven businesses that doesn't make it onto social media",
  "Pattaya property market notes: what's selling, what's sitting, and why",
  "Practical guides for living, driving and doing business on the Eastern Seaboard",
];

export default function NewsletterPage() {
  return (
    <div className="bg-paper text-ink">
      <PageHero
        eyebrow="Newsletter"
        title={<>What actually works <span className="italic text-gold">in Pattaya.</span></>}
        intro="A short weekly email on property, business and life in Pattaya — from someone who has been building here since 2007."
      />
      <section className="py-16 md:py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-6">
            <h2 className="font-serif text-3xl md:text-4xl mb-8">Every issue includes</h2>
            <ul className="space-y-5">
              {WHAT_YOU_GET.map((item) => (
                <li key={item} className="flex gap-4 text-lg text-black/70 font-light leading-relaxed">
                  <Check className="w-5 h-5 mt-1.5 shrink-0 text-gold-deep" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="bg-cream border border-cream-line rounded-2xl p-8 md:p-10">
              <h2 className="font-serif text-3xl mb-2">Join the list</h2>
              <p className="text-black/60 mb-6">Free. No spam. Your details are never shared.</p>
              <NewsletterSignup source="newsletter-page" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
