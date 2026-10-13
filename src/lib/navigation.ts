import { MouseEvent } from "react";

// Client-side navigation for the public site. App listens for popstate and resolves the
// view from the URL, so pushing a path and dispatching popstate is all a link needs to do.
export function navigate(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// onClick handler for internal <a href> links: real hrefs keep pages crawlable and
// open-in-new-tab working, while normal clicks stay in the app.
export function handleLinkClick(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const href = e.currentTarget.getAttribute("href");
  if (!href || !href.startsWith("/")) return;
  e.preventDefault();
  navigate(href);
}
