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

export function trackPageView() {
  if (!isTrackable()) return;
  afterLoad(() => {
    start();
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
