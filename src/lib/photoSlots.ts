// Where photos from the portal Photos tab appear on the public site.
//
// The admin picks a photo for each spot; choices are saved to Firestore (settings/photo_slots).
// At build time scripts/fetch-photo-slots.mjs copies that document to src/generated/photo-slots.json,
// which is bundled here, so pages never wait on Firestore. Spots with no photo keep their default.

export interface SlotPhoto {
  photoId: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface InlinePhoto extends SlotPhoto {
  id: string;
  /** The "## " heading whose section the photo is placed at the end of. */
  heading: string;
  caption?: string;
}

export interface PhotoSlotsData {
  slots: Record<string, SlotPhoto>;
  inline: Record<string, InlinePhoto[]>;
}

export interface SlotDef {
  id: string;
  label: string;
  group: string;
  defaultSrc?: string;
  defaultAlt: string;
  /** Shape the spot crops to, shown in the dashboard. */
  aspect: string;
}

// Fixed spots on the homepage and About page. Article headers are added per article (see articleHeaderSlot).
export const FIXED_SLOTS: SlotDef[] = [
  { id: "home-portrait", label: "Hero portrait", group: "Homepage", defaultSrc: "/images/shane-portrait.webp", defaultAlt: "Shane Ruddle", aspect: "768/1052" },
  { id: "home-award", label: "Award photo", group: "Homepage", defaultSrc: "/images/award-best-agent-pattaya-2026.webp", defaultAlt: "Shane Ruddle on the red carpet holding The Best Agent in Pattaya trophy and plaque at the Thailand Real Estate Agent Awards 2026", aspect: "2/3" },
  { id: "home-life-family", label: "Outside of business: Family", group: "Homepage", defaultSrc: "/images/life-family.webp", defaultAlt: "Family", aspect: "4/3" },
  { id: "home-life-running", label: "Outside of business: Running", group: "Homepage", defaultSrc: "/images/life-sports.webp", defaultAlt: "Running", aspect: "4/3" },
  { id: "home-life-team", label: "Outside of business: Team", group: "Homepage", defaultSrc: "/images/life-team.webp", defaultAlt: "Team", aspect: "4/3" },
  { id: "home-life-friends", label: "Outside of business: Friends", group: "Homepage", defaultSrc: "/images/life-friends.webp", defaultAlt: "Friends", aspect: "4/3" },
  { id: "about-portrait", label: "Portrait", group: "About page", defaultSrc: "/images/shane-portrait.webp", defaultAlt: "Shane Ruddle", aspect: "768/1052" },
];

export const articleHeaderSlot = (slug: string) => `article-header:${slug}`;

const generated = import.meta.glob("/src/generated/photo-slots.json", { eager: true, import: "default" }) as Record<string, Partial<PhotoSlotsData>>;
const raw = Object.values(generated)[0] || {};

export const PHOTO_SLOTS: PhotoSlotsData = {
  slots: raw.slots || {},
  inline: raw.inline || {},
};

/** The photo for a spot: the assigned one, or the spot's default. */
export function slotImage(id: string): { src?: string; alt: string; width?: number; height?: number } {
  const assigned = PHOTO_SLOTS.slots[id];
  const def = FIXED_SLOTS.find((s) => s.id === id);
  if (assigned?.url) return { src: assigned.url, alt: assigned.alt || def?.defaultAlt || "", width: assigned.width, height: assigned.height };
  return { src: def?.defaultSrc, alt: def?.defaultAlt || "" };
}

/** Alt text and size for any assigned photo, looked up by URL (article headers and inline photos). */
export function photoByUrl(url?: string): SlotPhoto | undefined {
  if (!url) return undefined;
  for (const p of Object.values(PHOTO_SLOTS.slots)) if (p.url === url) return p;
  for (const list of Object.values(PHOTO_SLOTS.inline)) for (const p of list) if (p.url === url) return p;
  return undefined;
}

/** The "## " headings in a markdown body, in order. */
export function sectionHeadings(body: string): string[] {
  return body.split(/\r?\n/).filter((l) => /^##\s+/.test(l)).map((l) => l.replace(/^##\s+/, "").trim());
}

/** Inserts an article's inline photos at the end of the section under the chosen heading. */
export function withInlinePhotos(slug: string, body: string): string {
  const photos = PHOTO_SLOTS.inline[slug];
  if (!photos?.length) return body;
  const lines = body.split(/\r?\n/);
  const out: string[] = [];
  let current: string | null = null;
  const flush = () => {
    if (current === null) return;
    for (const p of photos.filter((p) => p.heading === current && p.url)) {
      const alt = (p.alt || "").replace(/[\[\]]/g, "");
      const title = p.caption ? ` "${p.caption.replace(/"/g, "'")}"` : "";
      out.push("", `![${alt}](${p.url}${title})`, "");
    }
  };
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      flush();
      current = line.replace(/^##\s+/, "").trim();
    }
    out.push(line);
  }
  flush();
  return out.join("\n");
}
