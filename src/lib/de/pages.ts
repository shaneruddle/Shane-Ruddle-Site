// Copy for the German pages that aren't articles or the visa finder: page titles, the moving guide
// (/de/auswandern-nach-pattaya) and the areas overview (/de/wohngegenden-pattaya). Condensed from the
// German articles in content/articles-de; keep the figures in step with the English originals.

import type { Area as CalcArea } from "../costOfLiving";
import type { AreaId } from "../areas";
import { DE_AREAS, DE_ARTICLES, DE_CALCULATOR, DE_HOME, DE_MOVING, VISAS_PATH_DE } from "./site";

export const DE_PAGE_META: Record<string, { title: string; description: string }> = {
  [DE_HOME]: {
    title: "Shane Ruddle: Leben, Visum und Auswandern nach Pattaya, ehrlich erklärt",
    description:
      "Seit über 20 Jahren in Pattaya, Inhaber von sieben Unternehmen. Visum-Finder, Lebenshaltungskosten-Rechner und ehrliche Ratgeber zum Auswandern nach Thailand, auf Deutsch.",
  },
  [DE_ARTICLES]: {
    title: "Artikel auf Deutsch: Leben, Wohnen und Visum in Pattaya | Shane Ruddle",
    description:
      "Ratgeber zum Leben in Pattaya, Visum, Kosten, Wohnung mieten und kaufen, Gesundheit und Bankkonto, von einem Unternehmer, der seit über 20 Jahren dort lebt.",
  },
  [DE_CALCULATOR]: {
    title: "Lebenshaltungskosten Thailand: Rechner für Pattaya 2026 (in Euro) | Shane Ruddle",
    description:
      "Was kostet das Leben in Thailand? Wählen Sie Gegend, Wohnung, Essen und Schule und erhalten Sie Ihr Monatsbudget für Pattaya in Euro, Franken oder Baht. Echte Zahlen aus 20 Jahren vor Ort.",
  },
  [DE_MOVING]: {
    title: "Auswandern nach Thailand 2026: Voraussetzungen, Kosten, Visum",
    description:
      "Auswandern nach Pattaya: Kosten, die besten Wohngegenden, Visum, Gesundheit, Bankkonto und Wohnen. Alles, was ich einem Freund vor dem Umzug nach Thailand sagen würde.",
  },
  [DE_AREAS]: {
    title: "Wohnen in Pattaya: Die 6 besten Wohngegenden und was die Miete kostet (2026) | Shane Ruddle",
    description:
      "Central Pattaya, Pratumnak, Jomtien, Wongamat, Na Jomtien oder East Pattaya? Für wen jede Gegend passt und was ฿20.000 Monatsmiete dort bringen. Wohnung mieten in Pattaya, ehrlich erklärt.",
  },
};

export const DE_MOVING_FAQS: { q: string; a: string; href: string }[] = [
  {
    q: "Was sind die Voraussetzungen, um nach Thailand auszuwandern?",
    a: "Vor allem ein passendes Visum, und das hängt von Alter, Geld und Arbeit ab: Rentnervisum ab 50 mit ฿800.000 oder ฿65.000 Monatseinkommen, DTV für Remote-Arbeit, Non-B mit Arbeitserlaubnis für einen Job hier. Dazu eine Krankenversicherung und genug Geld für die ersten Monate.",
    href: VISAS_PATH_DE,
  },
  {
    q: "Was sind die Nachteile beim Auswandern nach Thailand?",
    a: "Sie bleiben immer auf einem Visum, das verlängert werden muss, ein Bankkonto ist schwieriger geworden, Grund und Boden dürfen Sie nicht besitzen, ohne Krankenversicherung geht es nicht, und viele Berufe sind Thais vorbehalten.",
    href: `${DE_ARTICLES}/auswandern-thailand-was-ich-gern-gewusst-haette`,
  },
  {
    q: "Wie ist das Leben in Pattaya wirklich?",
    a: "Langsamer, sonniger und freundlicher als im Westen. Stand 2026 lebt eine alleinstehende Person mit etwa ฿50.000 bis ฿60.000 im Monat gut, ein Paar mit ฿70.000 bis ฿80.000.",
    href: `${DE_ARTICLES}/leben-in-pattaya`,
  },
  {
    q: "Was kostet das Leben in Pattaya?",
    a: "Für eine alleinstehende Person in einem Condo mit einem Schlafzimmer grob ฿50.000 bis ฿55.000 im Monat, bei täglichem Essen gehen: etwa ฿18.000 Miete, ฿30.000 Essen und ein paar tausend für die Fortbewegung.",
    href: DE_CALCULATOR,
  },
  {
    q: "Welche Wohngegend ist die beste?",
    a: "Das hängt von Ihrer Lebensphase ab. Central Pattaya, wenn Sie jung sind und Trubel wollen, Jomtien für Rentner und Strand, Pratumnak für ein bisschen von beidem, East Pattaya mit Kindern oder Haustieren.",
    href: DE_AREAS,
  },
  {
    q: "Welches Visum brauche ich für den Ruhestand in Pattaya?",
    a: "Ein Rentnervisum, das Non-Immigrant O oder das O-A. Sie müssen mindestens 50 sein und ฿800.000 auf einem thailändischen Konto, ฿65.000 Monatseinkommen oder eine Kombination nachweisen (Stand November 2026).",
    href: VISAS_PATH_DE,
  },
  {
    q: "Brauche ich in Thailand eine Krankenversicherung?",
    a: "Ja, unbedingt. Die Privatkliniken sind sehr gut, aber Sie zahlen am Schalter. Ein normaler Krankenhausbesuch kostet meist ฿2.000 bis ฿3.000, und ohne Versicherung kann eine ernste Behandlung sehr teuer werden.",
    href: `${DE_ARTICLES}/krankenhaus-krankenversicherung-pattaya`,
  },
  {
    q: "Kann ich als Ausländer ein Bankkonto eröffnen?",
    a: "Ja, aber es ist schwieriger geworden. Sie müssen meist nachweisen, dass Sie hier leben, etwa mit einem langen Mietvertrag und einer Wohnsitzbescheinigung. Ich würde es zuerst bei der Kasikorn Bank versuchen.",
    href: `${DE_ARTICLES}/bankkonto-thailand-auslaender`,
  },
  {
    q: "Sollte ich mieten oder kaufen?",
    a: "Erst mieten. Ich würde nirgendwo auf der Welt kaufen, ohne den Ort vorher auszuprobieren, am besten für ein paar Jahre. Rechnen Sie mit einem 12-Monats-Vertrag und zwei Monatsmieten Kaution.",
    href: `${DE_ARTICLES}/wohnung-mieten-pattaya`,
  },
];

export const DE_MOVING_CHAPTERS: { title: string; blurb: string; slugs: string[] }[] = [
  {
    title: "Wie es wirklich ist",
    blurb: "Das Tempo, das Wetter, die Menschen, und was ich gern vorher gewusst hätte.",
    slugs: ["leben-in-pattaya", "auswandern-thailand-was-ich-gern-gewusst-haette", "als-rentner-nach-pattaya"],
  },
  {
    title: "Geld und Kosten",
    blurb: "Was das Leben hier kostet, und wie Bankkonto und Überweisungen heute funktionieren.",
    slugs: ["ist-pattaya-teuer", "bankkonto-thailand-auslaender"],
  },
  {
    title: "Visum und Gesundheit",
    blurb: "Das richtige Visum für die nächsten Jahre, und warum Sie eine Krankenversicherung brauchen.",
    slugs: ["visum-thailand-erfahrungen", "krankenhaus-krankenversicherung-pattaya"],
  },
  {
    title: "Wohnen",
    blurb: "Die richtige Gegend, mieten, und was Sie vor dem Kauf einer Eigentumswohnung wissen sollten.",
    slugs: ["beste-wohngegend-pattaya", "wohnung-mieten-pattaya", "eigentumswohnung-kaufen-pattaya"],
  },
];

export interface DeArea {
  id: AreaId;
  /** Slug of the English area page. */
  enSlug: string;
  name: string;
  tagline: string;
  verdict: string;
  suits: string[];
  notFor: string[];
  rent20k: string;
  calcArea?: CalcArea;
}

export const DE_AREA_LIST: DeArea[] = [
  {
    id: "central",
    enSlug: "central-pattaya",
    name: "Central Pattaya",
    tagline: "Mitten im Geschehen",
    verdict:
      "Dort spielt sich alles ab: Restaurants, Bars und das Leben der Stadt direkt vor der Haustür. Wäre ich wieder Anfang dreißig, würde ich dort wohnen. Dort habe ich selbst angefangen, bevor ich nach Pratumnak gezogen bin.",
    suits: ["Junge Singles, die Trubel wollen", "Wer lieber nicht selbst fährt", "Wer fast jeden Abend essen geht"],
    notFor: ["Familien mit Kindern", "Wer viel Platz fürs Geld will", "Haustierbesitzer, da nur wenige Condos Tiere erlauben"],
    rent20k: "Eine kleine Wohnung mit einem Schlafzimmer. In Central bekommen Sie am wenigsten für Ihr Geld.",
    calcArea: "central",
  },
  {
    id: "pratumnak",
    enSlug: "pratumnak",
    name: "Pratumnak",
    tagline: "Der ruhige Hügel zwischen Stadt und Jomtien",
    verdict:
      "Ich wohne selbst hier, ich bin also voreingenommen. Ruhiger als Central, aber näher am Geschehen als Jomtien: In die Stadt sind es etwa fünf Minuten mit dem Auto, nach Jomtien genauso. Es gibt viele sehr gute Restaurants und vor allem Hochhaus-Condos.",
    suits: ["Paare, die Ruhe wollen, ohne weit draußen zu wohnen", "Käufer, die an den langfristigen Wert denken", "Läufer: die Runde über den Hügel liegt immer im Schatten"],
    notFor: ["Knappe Budgets", "Wer ein Haus möchte", "Haustierbesitzer, da nur wenige Condos Tiere erlauben"],
    rent20k: "Eine kleine Wohnung mit einem Schlafzimmer. Pratumnak besteht vor allem aus Hochhaus-Condos.",
    calcArea: "pratumnak",
  },
  {
    id: "jomtien",
    enSlug: "jomtien",
    name: "Jomtien",
    tagline: "Der Strand, in langsamerem Tempo",
    verdict:
      "Hier würde ich ein Rentnerpaar anfangen lassen. Ruhiger, weniger los, und Sie wohnen direkt am Meer, mit Dutzenden Restaurants und vielen Gleichgesinnten. Die älteren Gebäude sind ein Vorteil: Sie bekommen mehr Platz für Ihr Geld.",
    suits: ["Rentnerpaare", "Strandliebhaber, die mehr Platz fürs Geld wollen", "Käufer, die langfristig denken"],
    notFor: ["Wer Nachtleben vor der Haustür will", "Haustierbesitzer, da nur wenige Condos Tiere erlauben"],
    rent20k: "Eine Wohnung mit einem Schlafzimmer, die etwas größer ist als in Wongamat oder Pratumnak, meist in einem älteren Gebäude.",
    calcArea: "jomtien",
  },
  {
    id: "wongamat",
    enSlug: "wongamat-naklua",
    name: "Wongamat & Naklua",
    tagline: "Neuere Hochhäuser im Norden der Stadt",
    verdict:
      "Besonders bei Russen beliebt, aber dort kann jeder gut leben. Tolle Restaurants, und das Terminal 21 ist zu Fuß erreichbar. Wer ein Condo sucht, landet bei Naklua Soi 18 und Soi 19: Sky Beach, Northpoint, Arom und Nova Mirage.",
    suits: ["Wer ein neueres Gebäude möchte", "Wer gern zu Fuß einkaufen geht", "Russischsprachige, die eine fertige Gemeinschaft vorfinden"],
    notFor: ["Knappe Budgets: eine der teureren Gegenden", "Wer ein Haus möchte", "Haustierbesitzer, da nur wenige Condos Tiere erlauben"],
    rent20k: "Womöglich nur ein kleines Studio. Es ist eine der teureren Gegenden.",
    calcArea: "wongamat",
  },
  {
    id: "najomtien",
    enSlug: "na-jomtien-bang-saray",
    name: "Na Jomtien & Bang Saray",
    tagline: "Weiter südlich, mehr Platz fürs Geld",
    verdict:
      "Südlich von Jomtien bekommen Sie mehr Wohnung für Ihr Geld, allerdings meist etwas zurückgesetzt statt direkt am Strand. Ruhiger und dörflicher, aber ohne eigenes Fahrzeug wird es schwierig.",
    suits: ["Wer mehr Platz fürs Geld will", "Wer gern selbst fährt", "Wer ein ruhigeres, dörfliches Gefühl mag"],
    notFor: ["Wer kein eigenes Fahrzeug hat", "Wer Stadtleben vor der Haustür will"],
    rent20k: "Eine größere Wohnung mit einem Schlafzimmer, aber meist etwas zurückgesetzt statt direkt am Strand.",
  },
  {
    id: "east",
    enSlug: "east-pattaya",
    name: "East Pattaya",
    tagline: "Häuser, Schulen und Platz",
    verdict:
      "Ruhiger, ideal für Familien und ältere Rentner. Vor allem Häuser, die meisten internationalen Schulen sind in der Nähe, und mit Haustieren landen Sie meist hier. Hier reicht Ihr Geld am weitesten, aber alles ist weitläufig: Die meisten fahren Auto.",
    suits: ["Familien mit Kindern an einer internationalen Schule", "Haustierbesitzer", "Wer ein Haus fürs Geld möchte"],
    notFor: ["Wer nicht Auto fahren möchte", "Wer zu Fuß an den Strand will"],
    rent20k: "Womöglich ein Haus mit zwei oder drei Schlafzimmern, allerdings ohne Pool.",
    calcArea: "east",
  },
];
