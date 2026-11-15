import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { AskTopic } from "./AskShane";
import { trackEvent } from "../lib/analytics";

// Two small pointers to the page's Ask Shane form (the section with id="ask"), so readers
// see the offer part-way down instead of only at the very end:
// AskOffer sits inside the content; AskFloatButton is a phone-only button that stays on screen.

const OFFERS: Record<AskTopic, { line: string; cta: string }> = {
  family: { line: "Moving with kids? Tell me their ages and I'll tell you which school and area I'd pick.", cta: "Ask me" },
  buying: { line: "Thinking of buying? Tell me your budget and what you want, and I'll tell you where I'd look and what to watch for.", cta: "Ask me" },
  renting: { line: "Not sure where to live? Tell me your budget and how you like to live, and I'll tell you the area I'd choose.", cta: "Ask me" },
  retiring: { line: "Planning to retire here? Tell me your budget and I'll tell you honestly if it works, and where.", cta: "Ask me" },
  business: { line: "Starting or buying a business here? Tell me the idea and I'll tell you what I'd check first.", cta: "Ask me" },
  visa: { line: "Not sure which visa fits? Tell me your age, income and plans and I'll tell you which one I'd go for.", cta: "Ask me" },
  visiting: { line: "Planning a trip? Tell me who's coming and for how long, and I'll tell you what I'd do.", cta: "Ask me" },
  other: { line: "Got a question about Pattaya this didn't answer? Ask me. I read every one and reply myself.", cta: "Ask me" },
};

function goToAsk(e: React.MouseEvent, source: string, kind: string) {
  const target = document.getElementById("ask");
  if (!target) return; // fall back to the plain #ask link
  e.preventDefault();
  trackEvent("select_content", { content_type: kind, source });
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  const field = target.querySelector<HTMLElement>("textarea, input:not([type=hidden])");
  window.setTimeout(() => field?.focus({ preventScroll: true }), 600);
}

export function AskOffer({ topic, source }: { topic: AskTopic; source: string }) {
  const offer = OFFERS[topic];
  return (
    <aside className="not-prose my-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-6 md:p-7 rounded-[1.25rem] border border-gold/40 bg-gold/10">
      <img src="/images/shane-portrait.webp" alt="" width={48} height={48} loading="lazy" className="hidden sm:block w-12 h-12 rounded-full object-cover shrink-0 ring-2 ring-gold/60" />
      <p className="flex-1 text-[17px] leading-snug text-ink font-normal m-0">{offer.line}</p>
      <a
        href="#ask"
        onClick={(e) => goToAsk(e, source, "ask_offer")}
        className="self-start sm:self-auto inline-flex items-center gap-2 px-5 py-3 bg-ink text-white text-xs font-semibold uppercase tracking-[0.18em] rounded-full hover:bg-gold hover:text-ink transition-colors whitespace-nowrap no-underline"
      >
        <MessageCircle className="w-4 h-4" /> {offer.cta}
      </a>
    </aside>
  );
}

export function AskFloatButton({ source }: { source: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let askVisible = false;
    const update = () => setShow(window.scrollY > 700 && !askVisible);
    const ask = document.getElementById("ask");
    const io = ask
      ? new IntersectionObserver(([entry]) => {
          askVisible = entry.isIntersecting;
          update();
        })
      : null;
    if (ask && io) io.observe(ask);
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", update);
      io?.disconnect();
    };
  }, []);

  return (
    <a
      href="#ask"
      onClick={(e) => goToAsk(e, source, "ask_float_button")}
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`md:hidden fixed z-40 left-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] inline-flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-ink text-white shadow-xl shadow-black/25 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <img src="/images/shane-portrait.webp" alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover ring-2 ring-gold/70" />
      Ask Shane
    </a>
  );
}
