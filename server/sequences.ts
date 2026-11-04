// Welcome email sequences, one per type of visitor. A visitor joins a sequence when they email
// themselves a result from one of the tools (see server/leads.ts). The daily run in
// .github/workflows/sequences.yml sends whatever is due.
//
// A sequence only sends once Shane has approved its emails: set `approved: true`.
// Until then, people still join it and simply wait at the first email.
//
// Email bodies: paragraphs separated by a blank line, links written as [text](url).
// "Hi <first name>," is added automatically, and the sign-off and unsubscribe link are added at the end.

export type Segment = "moving" | "retiring" | "property" | "business" | "visiting" | "work";

export type SequenceEmail = { day: number; subject: string; body: string };

export const SEQUENCES: Partial<Record<Segment, { approved: boolean; emails: SequenceEmail[] }>> = {
  moving: { approved: false, emails: [] },
  retiring: { approved: false, emails: [] },
  property: { approved: false, emails: [] },
  business: { approved: false, emails: [] },
};
