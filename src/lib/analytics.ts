// Google Analytics 4 for the public site (property "Shane Ruddle Personal Site").
// The tag loads after the page has painted so it never delays first render, and page views are
// sent manually because navigation happens in the app without full page loads.
// Nothing is tracked inside the staff portal.

const GA_ID = "G-DSPCBBCF6M";

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let started = false;

function isTrackable(path = window.location.pathname) {
  return import.meta.env.PROD && !path.startsWith("/portal") && /(^|\.)shaneruddle\.com$/.test(window.location.hostname);
}

function start() {
  if (started) return;
  started = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: false });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);
}

// Runs fn once the page has finished loading (immediately if it already has).
function afterLoad(fn: () => void) {
  if (document.readyState === "complete") fn();
  else window.addEventListener("load", () => setTimeout(fn, 0), { once: true });
}

// AI assistants that send visitors with a referrer or a utm_source. Google's own AI Overviews and
// AI Mode can't be told apart this way: they arrive as ordinary google.com visits.
const AI_SOURCES: [RegExp, string][] = [
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/, "chatgpt"],
  [/(^|\.)perplexity\.ai$/, "perplexity"],
  [/(^|\.)gemini\.google\.com$|^bard\.google\.com$/, "gemini"],
  [/(^|\.)copilot\.microsoft\.com$|^edgeservices\.bing\.com$/, "copilot"],
  [/(^|\.)claude\.ai$/, "claude"],
  [/(^|\.)(deepseek\.com|chat\.deepseek\.com)$/, "deepseek"],
  [/(^|\.)(you\.com|phind\.com|meta\.ai|grok\.com|x\.ai|mistral\.ai)$/, "other_ai"],
];

function aiSource(): string | null {
  const candidates: string[] = [];
  try {
    if (document.referrer) candidates.push(new URL(document.referrer).hostname);
  } catch {
    /* ignore malformed referrers */
  }
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  if (utm) candidates.push(utm.toLowerCase());
  for (const host of candidates) {
    for (const [re, name] of AI_SOURCES) if (re.test(host)) return name;
  }
  return null;
}

// Sends one "ai_referral" event per visit that started from an AI assistant, so GA4 can count
// them (Reports > Engagement > Events, or the insights endpoint with eventName = ai_referral).
let aiChecked = false;
function trackAiReferral() {
  if (aiChecked) return;
  aiChecked = true;
  const source = aiSource();
  if (!source) return;
  try {
    if (sessionStorage.getItem("ai_referral")) return;
    sessionStorage.setItem("ai_referral", source);
  } catch {
    /* storage blocked: still send once for this page load */
  }
  window.gtag?.("event", "ai_referral", { ai_source: source, landing_page: window.location.pathname });
}

export function trackPageView() {
  if (!isTrackable()) return;
  afterLoad(() => {
    start();
    trackAiReferral();
    // Let the new page set its title first.
    setTimeout(() => {
      window.gtag?.("event", "page_view", {
        page_location: window.location.href,
        page_path: window.location.pathname,
        page_title: document.title,
      });
    }, 0);
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!isTrackable()) return;
  start();
  window.gtag?.("event", name, params);
}
