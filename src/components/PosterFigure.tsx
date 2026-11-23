import { useState } from "react";
import { Check, Code2, Download } from "lucide-react";
import { POSTERS, SITE, posterEmbedCode, posterImage, type PosterId } from "../lib/posters";
import { trackEvent } from "../lib/analytics";

// An infographic poster with the same figures as a real table beside it (Google reads the table,
// people share the picture), plus Pinterest, download and "embed this poster" with a credit link.
export default function PosterFigure({ id, className = "", stacked = false }: { id: PosterId; className?: string; /** One column, for narrow layouts like articles. */ stacked?: boolean }) {
  const p = POSTERS[id];
  const [embedOpen, setEmbedOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pageUrl = SITE + p.path;
  const pinUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(pageUrl)}&media=${encodeURIComponent(SITE + posterImage(p, "pin"))}&description=${encodeURIComponent(`${p.title} | Shane Ruddle`)}`;
  const embed = posterEmbedCode(p);
  const track = (action: string) => trackEvent("poster_action", { poster: p.id, action });

  return (
    <section className={`grid gap-8 items-start ${stacked ? "" : "md:grid-cols-12 md:gap-10"} ${className}`} aria-labelledby={`poster-${p.id}`}>
      <figure className={stacked ? "max-w-md w-full mx-auto" : "md:col-span-5"}>
        <a href={posterImage(p)} target="_blank" rel="noopener" onClick={() => track("open")}>
          <img
            src={posterImage(p)}
            alt={p.alt}
            width={1080}
            height={1350}
            decoding="async"
            className="w-full h-auto rounded-2xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)] border border-black/[0.06]"
          />
        </a>
        <figcaption className="sr-only">{p.title}</figcaption>
      </figure>

      <div className={stacked ? "" : "md:col-span-7"}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep mb-3">{p.eyebrow}</p>
        <h2 id={`poster-${p.id}`} className="font-serif text-2xl md:text-4xl leading-tight mb-3 [font-variant-numeric:lining-nums]">
          {p.title}
          {p.big && <span className="block text-gold-deep">{p.big}</span>}
        </h2>
        <p className="text-black/60 leading-relaxed mb-6">{p.intro}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <caption className="sr-only">{p.title}: the figures in the poster</caption>
            <thead>
              <tr className="border-b-2 border-ink">
                {p.columns.map((c, i) => (
                  <th key={c} scope="col" className={`py-2 pr-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-deep ${i === 1 ? "text-right sm:pr-5" : ""} ${i === 2 ? "hidden sm:table-cell" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.rows.map((r) => (
                <tr key={r.label} className="border-b border-black/[0.08] align-top">
                  <th scope="row" className="py-3 pr-3 font-medium text-ink">
                    {r.label}
                    <span className="sm:hidden block mt-1 font-normal text-black/55">{r.note}</span>
                  </th>
                  <td className="py-3 sm:pr-5 text-right font-serif text-lg text-ink [font-variant-numeric:lining-nums]">
                    <span className="whitespace-nowrap">
                    {r.value}</span>
                    {r.valueSub && <span className="block font-sans text-xs text-black/45">{r.valueSub}</span>}
                  </td>
                  <td className="hidden sm:table-cell py-3 text-black/60">{r.note}</td>
                </tr>
              ))}
            </tbody>
            {p.total && (
              <tfoot>
                <tr>
                  <th scope="row" className="py-3 pr-3 font-semibold text-ink">{p.total.label}</th>
                  <td colSpan={2} className="py-3 font-serif text-xl text-ink [font-variant-numeric:lining-nums]">
                    {p.total.value}
                    {p.total.sub && <span className="block sm:inline sm:ml-2 font-sans text-sm text-black/50">{p.total.sub}</span>}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {p.points.length > 0 && (
          <div className="mt-5">
            {p.pointsTitle && <p className="text-sm font-semibold text-ink mb-2">{p.pointsTitle}</p>}
            <ul className="space-y-1.5 text-sm text-black/65 list-disc pl-5 marker:text-gold">
              {p.points.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-4 text-xs text-black/45">{p.source}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <a href={pinUrl} target="_blank" rel="noopener" onClick={() => track("pinterest")} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-white text-xs font-semibold tracking-wider hover:bg-gold-deep">
            Save to Pinterest
          </a>
          <a href={posterImage(p)} download onClick={() => track("download")} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/15 text-xs font-semibold tracking-wider text-black/70 hover:border-gold-deep">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
          <button type="button" aria-expanded={embedOpen} onClick={() => { setEmbedOpen((o) => !o); track("embed_open"); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/15 text-xs font-semibold tracking-wider text-black/70 hover:border-gold-deep">
            <Code2 className="w-3.5 h-3.5" /> Embed this poster
          </button>
        </div>
        {embedOpen && (
          <div className="mt-4 p-4 rounded-2xl bg-cream border border-cream-line">
            <p className="text-sm text-black/65 mb-3">You're welcome to use this poster on your own site or blog. Please keep the credit link.</p>
            <textarea readOnly value={embed} rows={4} onFocus={(e) => e.currentTarget.select()} className="w-full p-3 rounded-xl border border-black/10 bg-white font-mono text-xs text-black/70" />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(embed).then(() => setCopied(true));
                track("embed_copy");
              }}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-white text-xs font-semibold tracking-wider"
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : "Copy the code"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
