import { useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { germanPathFor } from "../../lib/de/site";
import { handleLinkClick } from "../../lib/navigation";
import { trackEvent } from "../../lib/analytics";

// Small prompt on English pages for visitors whose browser prefers German, linking to the German
// version of the same page. Only loaded for those visitors, and only shown where a German page exists.

const KEY = "sr_de_banner_closed";
const wasClosed = () => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export default function GermanBanner({ path }: { path: string }) {
  const [closed, setClosed] = useState(wasClosed);
  const target = germanPathFor(path);
  if (closed || !target) return null;
  const close = () => {
    setClosed(true);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };
  return (
    <div lang="de" className="fixed bottom-4 left-4 right-20 sm:right-auto z-[9000] flex items-center gap-2 bg-ink text-white rounded-full pl-5 pr-2 py-2 shadow-2xl shadow-black/30">
      <a
        href={target}
        hrefLang="de"
        onClick={(e) => {
          trackEvent("select_content", { content_type: "language_switch", language: "de", source: path });
          close();
          handleLinkClick(e);
        }}
        className="flex items-center gap-2 text-sm hover:text-gold"
      >
        Diese Seite gibt es auch auf Deutsch <ArrowRight className="w-4 h-4 text-gold" />
      </a>
      <button type="button" onClick={close} aria-label="Schließen" className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
