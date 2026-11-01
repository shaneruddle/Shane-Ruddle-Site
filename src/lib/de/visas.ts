// German edition of the Thai visa finder (/de/thailand-visum). Same visas, ids and finder logic as
// ../visas.ts (recommendVisa is reused, so the outcomes always match the English finder); only the
// copy and the slugs are German. Keep the figures in step with ../visas.ts when the rules change.

import { RULES_AS_OF, VISA_QUESTIONS, VisaAnswers, VisaId, ThaiVisa, recommendVisa } from "../visas";

export const VISAS_PATH_DE = "/de/thailand-visum";
export const RULES_AS_OF_DE = RULES_AS_OF.replace("October", "Oktober");

export type ThaiVisaDe = Omit<ThaiVisa, "articles"> & {
  /** German article slugs (content/articles-de). */
  articles: string[];
};

export const VISAS_DE: ThaiVisaDe[] = [
  {
    id: "retirement",
    slug: "rentnervisum",
    name: "Rentnervisum",
    official: "Non-Immigrant O (Ruhestand), O-A und O-X",
    tagline: "Für alle ab 50, die das Geld nachweisen können",
    metaTitle: "Rentnervisum Thailand 2026: ฿800.000-Regel, O oder O-A, Verlängerung in Pattaya | Shane Ruddle",
    description:
      "Rentnervisum Thailand 2026: ab 50, ฿800.000 auf einem thailändischen Konto oder ฿65.000 im Monat. Non-O, O-A oder O-X, und die jährliche Verlängerung in Pattaya.",
    fromShane: true,
    glance: {
      stay: "Jeweils 1 Jahr, hier verlängert",
      money: "฿800.000 auf einem Thai-Konto, ฿65.000 Monatseinkommen oder eine Kombination",
      cost: "฿1.900 pro jährlicher Verlängerung",
      work: "Nein",
    },
    fit: "Sie mindestens 50 sind und ฿800.000 oder ฿65.000 im Monat nachweisen können",
    intro: [
      "Rentner nutzen ein Rentnervisum. Die zwei gängigsten sind das Non-Immigrant O, das Sie einmal bekommen und dann jedes Jahr hier in Pattaya verlängern, und das O-A, das Sie in Ihrem Heimatland beantragen.",
      "Sie müssen mindestens 50 sein und nachweisen, dass Sie genug Geld haben: ฿800.000 auf einem thailändischen Bankkonto, ein Einkommen von ฿65.000 im Monat oder eine Kombination aus beidem.",
    ],
    take: "Für thailändische Verhältnisse ist es relativ einfach. Wenn Sie das Geld nachweisen können, ist es ziemlich unkompliziert. Trotzdem würde ich immer eine Visa-Agentur nutzen. Davon gibt es in der Stadt genug, und sie machen das Ganze sehr viel weniger mühsam.",
    suits: [
      "Sie sind 50 oder älter und wollen den Großteil des Jahres hier leben",
      "Sie haben Ersparnisse oder eine Rente, die Sie nachweisen können",
      "Sie müssen in Thailand nicht arbeiten",
    ],
    requirements: [
      "Mindestens 50 Jahre alt",
      "฿800.000 auf einem thailändischen Bankkonto, oder ฿65.000 Monatseinkommen, oder eine Kombination aus beidem",
      "Das Guthaben muss meist 2 Monate vor dem Antrag auf dem Konto liegen, 3 Monate danach dort bleiben und darf dann nicht unter ฿400.000 fallen (vor dem Antrag prüfen)",
      "Reisepass mit mindestens 6 Monaten Gültigkeit, Fotos und Nachweis Ihrer Adresse in Pattaya",
      "Nur beim O-A: eine Krankenversicherung mit der von der Botschaft verlangten Mindestdeckung, ein Führungszeugnis und ein ärztliches Attest (vor dem Antrag prüfen)",
    ],
    steps: [
      "Holen Sie sich ein Non-Immigrant-O-Visum bei einer thailändischen Botschaft, oder beantragen Sie das O-A von zu Hause",
      "Eröffnen Sie ein thailändisches Bankkonto und überweisen Sie das Geld früh genug, damit es lange genug dort liegt",
      "Beantragen Sie die einjährige Verlängerung bei der Immigration in Jomtien (฿1.900)",
      "Melden Sie alle 90 Tage Ihre Adresse (persönlich, per Post oder online)",
      "Holen Sie vor jeder Reise ein Re-Entry-Permit: ฿1.000 für eine Einreise oder ฿3.800 für mehrere",
      "Wiederholen Sie die Verlängerung jedes Jahr",
    ],
    watch: [
      "Wer ohne Re-Entry-Permit ausreist, verliert seine Verlängerung",
      "Zahlen Sie nicht für Thailand Privilege, wenn Sie ohnehin ein Rentnervisum bekommen",
      "Mit einem Rentnervisum dürfen Sie nicht arbeiten. Wenn Sie vielleicht ein Geschäft gründen, planen Sie später ein Non-B ein",
      "Es gibt auch das O-X, ein 10-Jahres-Rentnervisum für bestimmte Nationalitäten mit deutlich höheren finanziellen Anforderungen (vor dem Antrag prüfen)",
    ],
    faqs: [
      {
        q: "Wie viel Geld brauche ich für ein thailändisches Rentnervisum?",
        a: "฿800.000 auf einem thailändischen Bankkonto oder ein Einkommen von ฿65.000 im Monat oder eine Kombination aus beidem (Stand Oktober 2026). Außerdem müssen Sie mindestens 50 sein.",
      },
      {
        q: "Was ist der Unterschied zwischen Non-O und O-A?",
        a: "Das O-A beantragen Sie in Ihrem Heimatland, und es verlangt vorab eine Krankenversicherung und mehr Papierkram. Mit dem Non-O kommen Sie her und verlängern es dann jeweils um ein Jahr bei der Immigration in Pattaya.",
      },
      {
        q: "Sollte ich für mein Rentnervisum eine Agentur nutzen?",
        a: "Ich würde es tun. Davon gibt es in Pattaya genug, und sie machen das Ganze sehr viel weniger mühsam.",
      },
    ],
    articles: ["visum-thailand-erfahrungen", "als-rentner-nach-pattaya", "bankkonto-thailand-auslaender", "krankenhaus-krankenversicherung-pattaya"],
    askTopic: "retiring",
    officialUrl: { label: "Thai e-Visa (offiziell)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "dtv",
    slug: "dtv-visum",
    name: "DTV (Destination Thailand Visa)",
    official: "Destination Thailand Visa (DTV)",
    tagline: "Fünf Jahre für Remote-Arbeiter, mit Aufenthalten von 180 Tagen",
    metaTitle: "DTV-Visum Thailand 2026: ฿500.000-Regel, 180 Tage pro Einreise und der Haken | Shane Ruddle",
    description:
      "Das Destination Thailand Visa (DTV), erklärt von einem Einwohner Pattayas seit 20 Jahren: 5 Jahre, 180 Tage pro Einreise, ฿500.000 Ersparnisse, die Änderungen vom August 2026 und der Haken.",
    fromShane: true,
    glance: {
      stay: "5 Jahre, bis zu 180 Tage pro Einreise",
      money: "Etwa ฿500.000 an Ersparnissen",
      cost: "Etwa ฿10.000 (legt jede Botschaft selbst fest)",
      work: "Nur Remote-Arbeit für Kunden im Ausland",
    },
    fit: "Sie online arbeiten und lange bleiben wollen, ohne thailändischen Arbeitgeber",
    intro: [
      "Für Leute, die online arbeiten, gibt es das DTV, das Destination Thailand Visa. Es gilt fünf Jahre, mit Aufenthalten von bis zu 180 Tagen pro Einreise, und Sie müssen etwa ฿500.000 an Ersparnissen nachweisen.",
      "Es gilt auch für „Soft Power“-Aktivitäten wie Muay Thai, thailändische Kochkurse oder medizinische Behandlungen, und Ehepartner und Kinder können als Angehörige mitkommen (vor dem Antrag prüfen).",
    ],
    take: "Verstehen Sie aber, was es ist: im Grunde ein Langzeit-Touristenvisum. Auch wenn es bis zu fünf Jahre gilt, gelten Sie weiterhin als Tourist, nicht als Einwanderer, und deshalb kann zum Beispiel die Eröffnung eines Bankkontos schwierig sein, je nach Bank.",
    suits: [
      "Remote-Arbeiter, Freiberufler und digitale Nomaden",
      "Unter 50-Jährige, die lange Zeit hier verbringen wollen",
      "Leute, die einen langen Kurs machen, etwa Muay Thai oder thailändisches Kochen",
    ],
    requirements: [
      "Etwa ฿500.000 an Ersparnissen, meist rund 3 Monate gehalten (vor dem Antrag prüfen)",
      "Nachweis der Remote-Arbeit (Arbeitsvertrag oder eigene Firma im Ausland) oder Anmeldung zu einer anerkannten Aktivität",
      "Seit 31. August 2026: Nachweis, dass Sie in dem Land wohnen, in dem Sie den Antrag stellen, und ein Führungszeugnis (vor dem Antrag prüfen)",
      "Reisepass mit mindestens 6 Monaten Gültigkeit",
    ],
    steps: [
      "Beantragen Sie es online über die offizielle Thai-e-Visa-Seite aus dem Land, in dem Sie wohnen",
      "Reisen Sie nach Thailand ein und bleiben Sie bis zu 180 Tage",
      "Verlängern Sie einmal um weitere 180 Tage bei der Immigration in Jomtien, oder reisen Sie aus und kommen für neue 180 Tage zurück",
      "Melden Sie alle 90 Tage Ihre Adresse, wenn Sie so lange am Stück bleiben",
    ],
    watch: [
      "Mit einem DTV dürfen Sie nicht für eine thailändische Firma arbeiten oder hier ein Geschäft führen",
      "Manche Banken eröffnen mit einem Visum der Touristenklasse kein Konto",
      "Wer 180 Tage oder mehr im Jahr hier verbringt, wird steuerlich ansässig, eingeführtes Auslandseinkommen kann dann steuerpflichtig sein (mit einem Steuerberater klären)",
    ],
    faqs: [
      {
        q: "Wie viel Geld brauche ich für das DTV?",
        a: "Etwa ฿500.000 an Ersparnissen (Stand Oktober 2026). Die Botschaften wollen meist sehen, dass das Geld einige Monate auf dem Konto liegt.",
      },
      {
        q: "Darf ich mit einem DTV in Thailand arbeiten?",
        a: "Nur remote, für Kunden oder einen Arbeitgeber außerhalb Thailands. Für eine thailändische Firma arbeiten oder hier ein Geschäft führen dürfen Sie nicht.",
      },
      {
        q: "Was ist der Haken beim DTV?",
        a: "Es ist im Grunde ein Langzeit-Touristenvisum. Sie gelten als Tourist, nicht als Einwanderer, und deshalb kann etwa die Kontoeröffnung schwierig sein, je nach Bank.",
      },
    ],
    articles: ["visum-thailand-erfahrungen", "bankkonto-thailand-auslaender"],
    askTopic: "visa",
    officialUrl: { label: "Thai e-Visa (offiziell)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "privilege",
    slug: "thailand-privilege-visum",
    name: "Thailand Privilege (Elite)",
    official: "Thailand Privilege Card (früher Thailand Elite)",
    tagline: "Einmal zahlen, kaum Papierkram, aber Arbeiten ist nicht erlaubt",
    metaTitle: "Thailand Privilege (Elite) Visum 2026: Preise, für wen es passt und der teure Fehler | Shane Ruddle",
    description:
      "Preise für das Thailand-Privilege-Visum (früher Elite) 2026, ab ฿650.000 für 5 Jahre, und der teure Fehler, den ein Bekannter damit gemacht hat. Von einem Unternehmer in Pattaya.",
    fromShane: true,
    glance: {
      stay: "5 bis 20 Jahre, je nach Paket",
      money: "Kein Vermögensnachweis, Sie zahlen eine Mitgliedsgebühr",
      cost: "Ab ฿650.000 für 5 Jahre",
      work: "Nein",
    },
    fit: "Sie lieber einmal zahlen, als sich jedes Jahr mit Papierkram zu beschäftigen",
    intro: [
      "Thailand Privilege, früher Elite-Visum genannt, ist eine Mitgliedschaft, die Sie kaufen. Es gibt keine Alters- oder Vermögensprüfung, und wenn Sie einmal bezahlt haben, gibt es kaum Papierkram oder Aufwand.",
      "Die Pakete beginnen bei ฿650.000 für fünf Jahre. Andere Pakete laufen 10, 15 und 20 Jahre, für mehr Geld (vor dem Antrag prüfen).",
    ],
    take: "Ein Bekannter von mir hat ein Elite-Visum gekauft. Es hat ihn fast eine Million Baht gekostet. Dann wollte er arbeiten. Thailand Privilege ist kein Arbeitsvisum, und es gab keine Möglichkeit, es in ein Business-Visum umzuwandeln. Er musste es aufgeben. Das Geld war komplett verschwendet. Überlegen Sie, was Sie in ein paar Jahren hier vielleicht machen möchten, nicht nur jetzt.",
    suits: [
      "Unter 50-Jährige, die langfristig bleiben wollen, ohne zu arbeiten",
      "Leute, die zahlen, um jährliche Verlängerungen und Bankguthaben zu vermeiden",
      "Alle, die sicher sind, dass sie hier nie arbeiten wollen",
    ],
    requirements: [
      "Mitgliedsgebühr: etwa ฿650.000 (5 Jahre), ฿900.000 (5 Jahre), ฿1,5 Mio. (10 Jahre), ฿2,5 Mio. (15 Jahre), ฿5 Mio. (20 Jahre) (vor dem Antrag prüfen)",
      "Das günstigste 5-Jahres-Paket wird Ende 2026 möglicherweise für neue Mitglieder geschlossen (vor dem Antrag prüfen)",
      "Reisepass und eine Hintergrundprüfung durch den Betreiber",
      "Keine Anforderungen an Alter, Einkommen oder Ersparnisse",
    ],
    steps: [
      "Bewerben Sie sich über die Thailand Privilege Card Co. oder einen ihrer autorisierten Agenten",
      "Zahlen Sie die Gebühr nach der Zusage",
      "Lassen Sie das Visum einstempeln und reisen Sie nach Thailand ein",
      "Melden Sie alle 90 Tage Ihre Adresse (Mitglieder bekommen dabei Hilfe)",
    ],
    watch: [
      "Es ist kein Arbeitsvisum und lässt sich auch nicht in eines umwandeln",
      "Wenn Sie 50 oder älter sind und ฿800.000 nachweisen können, kostet ein Rentnervisum nur einen Bruchteil davon",
      "Die Gebühr wird nicht erstattet, wenn sich Ihre Pläne ändern",
    ],
    faqs: [
      {
        q: "Was kostet Thailand Privilege?",
        a: "Die Pakete beginnen bei ฿650.000 für fünf Jahre (Stand Oktober 2026), längere Pakete kosten mehr.",
      },
      {
        q: "Darf ich mit Thailand Privilege arbeiten?",
        a: "Nein. Es ist kein Arbeitsvisum und lässt sich nicht in ein Business-Visum umwandeln. Wenn Sie vielleicht arbeiten möchten, ist es die falsche Wahl.",
      },
      {
        q: "Lohnt sich Thailand Privilege?",
        a: "Nur wenn Sie sicher sind, dass Sie nicht arbeiten wollen, und für nichts Günstigeres infrage kommen. Ich kenne jemanden, der fast eine Million Baht bezahlt hat und es aufgeben musste, als er arbeiten wollte.",
      },
    ],
    articles: ["visum-thailand-erfahrungen", "auswandern-thailand-was-ich-gern-gewusst-haette"],
    askTopic: "visa",
    officialUrl: { label: "Thailand Privilege (offiziell)", url: "https://www.thailandprivilege.co.th/" },
  },
  {
    id: "business",
    slug: "business-visum-arbeitserlaubnis",
    name: "Business-Visum und Arbeitserlaubnis",
    official: "Non-Immigrant B mit Work Permit",
    tagline: "Das Visum, das Sie brauchen, um hier zu arbeiten oder ein Geschäft zu führen",
    metaTitle: "Business-Visum Thailand (Non-B) und Arbeitserlaubnis in Pattaya, 2026 | Shane Ruddle",
    description:
      "Das Non-Immigrant-B-Visum und die Arbeitserlaubnis, von einem Unternehmer in Pattaya, der seit 20 Jahren eines hat: wer es braucht, was die Firma braucht und wie die Verlängerung läuft.",
    fromShane: true,
    glance: {
      stay: "Jeweils 1 Jahr, solange Sie die Stelle haben",
      money: "Die Firma muss die Voraussetzungen erfüllen, nicht Sie",
      cost: "Unterschiedlich. Die meisten bezahlen eine Agentur",
      work: "Ja, mit Arbeitserlaubnis",
    },
    fit: "Sie für eine thailändische Firma arbeiten oder hier Ihr eigenes Geschäft führen wollen",
    intro: [
      "Das Non-Immigrant B ist das Business-Visum, und das brauchen Sie, um in Thailand zu arbeiten. Es läuft parallel zur Arbeitserlaubnis (Work Permit), und beides ist an die Firma gebunden, für die Sie arbeiten.",
      "Wenn Sie hier ein eigenes Geschäft gründen, stellt Ihre Firma Sie an und beantragt Ihre Arbeitserlaubnis. Die Firma braucht meist ฿2 Millionen registriertes Kapital und vier thailändische Angestellte pro ausländischem Mitarbeiter (vor dem Antrag prüfen).",
    ],
    take: "Ich habe ein Non-Immigrant-B-Visum. Für mich war es immer einfach, weil ich seit 20 Jahren dieselbe Agentin habe. Sie ist immer noch im Geschäft, ich bezahle sie, und sie erledigt alles für mich.",
    suits: [
      "Alle mit einem Jobangebot einer thailändischen Firma",
      "Leute, die in Pattaya ein Geschäft gründen oder kaufen",
      "Alle, die in ein paar Jahren vielleicht hier arbeiten möchten",
    ],
    requirements: [
      "Ein thailändischer Arbeitgeber oder Ihre eigene thailändische Firma, die Sie anstellt",
      "Meist ฿2 Millionen registriertes Kapital und 4 thailändische Angestellte pro ausländischem Mitarbeiter (vor dem Antrag prüfen)",
      "Firmenunterlagen, Ihr Vertrag, Qualifikationsnachweise und ein ärztliches Attest",
      "Eine Arbeitserlaubnis vom Department of Employment",
    ],
    steps: [
      "Holen Sie sich das Jobangebot oder gründen Sie zuerst Ihre Firma",
      "Beantragen Sie ein Non-Immigrant-B-Visum bei einer thailändischen Botschaft (oder wechseln Sie Ihr Visum hier über eine Agentur)",
      "Beantragen Sie die Arbeitserlaubnis, sobald Sie in Thailand sind",
      "Verlängern Sie jeweils um ein Jahr bei der Immigration in Jomtien",
      "Melden Sie alle 90 Tage Ihre Adresse",
    ],
    watch: [
      "Das Visum endet mit dem Job, ein Arbeitgeberwechsel bedeutet also neuen Papierkram",
      "Arbeiten Sie mit keinem anderen Visum, auch nicht mit dem DTV oder Thailand Privilege",
      "Eine gute Agentur spart viel Zeit. Ich nutze seit 20 Jahren dieselbe",
    ],
    faqs: [
      {
        q: "Welches Visum brauche ich, um in Thailand zu arbeiten?",
        a: "Ein Non-Immigrant-B-Visum (Business), das parallel zu einer Arbeitserlaubnis läuft.",
      },
      {
        q: "Kann ich mit einem Business-Visum mein eigenes Geschäft in Pattaya führen?",
        a: "Ja. Ihre thailändische Firma stellt Sie an und beantragt Ihre Arbeitserlaubnis.",
      },
      {
        q: "Kann ich von Thailand Privilege zu einem Business-Visum wechseln?",
        a: "Nein. Eine Umwandlung ist nicht möglich. Wenn Sie vielleicht arbeiten möchten, fangen Sie nicht mit Thailand Privilege an.",
      },
    ],
    articles: ["visum-thailand-erfahrungen"],
    askTopic: "business",
  },
  {
    id: "ltr",
    slug: "ltr-visum",
    name: "LTR (Long-Term Resident)",
    official: "Long-Term Resident (LTR) Visum",
    tagline: "Zehn Jahre für Gutverdiener, wohlhabende Rentner und Fachkräfte",
    metaTitle: "LTR-Visum Thailand 2026: Das 10-Jahres-Visum einfach erklärt | Shane Ruddle",
    description:
      "Das thailändische Long-Term-Resident-Visum (LTR) verständlich erklärt: 10 Jahre, die vier Kategorien, Einkommensregeln für Rentner und Remote-Arbeiter, und für wen es sich wirklich lohnt.",
    fromShane: false,
    glance: {
      stay: "10 Jahre (5 + 5)",
      money: "Etwa US$80.000 Jahreseinkommen oder US$1 Mio. Vermögen",
      cost: "Etwa ฿50.000",
      work: "Ja, mit digitaler Arbeitserlaubnis (die meisten Kategorien)",
    },
    fit: "Ihr Einkommen oder Vermögen hoch genug ist, um sich für 10 Jahre zu qualifizieren",
    intro: [
      "Das LTR ist Thailands 10-Jahres-Visum für Menschen, die die Regierung anziehen möchte. Es wird vom Board of Investment (BOI) verwaltet, nicht von der Immigration, und bringt weniger Pflichten mit sich: Sie melden sich einmal im Jahr statt alle 90 Tage.",
      "Es gibt vier Kategorien: wohlhabende Weltbürger, wohlhabende Rentner (ab 50), Fachleute, die von Thailand aus arbeiten, und hochqualifizierte Fachkräfte.",
    ],
    suits: [
      "Rentner ab 50 mit etwa US$80.000 im Jahr aus Rente oder Kapitalerträgen",
      "Remote-Angestellte mit etwa US$80.000 im Jahr bei einer etablierten Firma im Ausland",
      "Leute mit US$1 Mio. Vermögen, die US$500.000 in Thailand investieren",
    ],
    requirements: [
      "Wohlhabender Rentner: ab 50, etwa US$80.000 passives Jahreseinkommen, oder US$40.000 plus eine Investition von US$250.000 in Thailand (vor dem Antrag prüfen)",
      "Von Thailand aus arbeiten: etwa US$80.000 im Jahr von einem etablierten Arbeitgeber im Ausland (vor dem Antrag prüfen)",
      "Wohlhabender Weltbürger: US$1 Mio. Vermögen und eine Investition von US$500.000 in Thailand (vor dem Antrag prüfen)",
      "Krankenversicherung, meist mit mindestens US$50.000 Deckung (vor dem Antrag prüfen)",
    ],
    steps: [
      "Prüfen Sie auf der LTR-Seite des Board of Investment, in welche Kategorie Sie passen",
      "Beantragen Sie es online und warten Sie auf das Qualifikationsschreiben des BOI",
      "Lassen Sie das Visum bei einer Botschaft oder in Thailand ausstellen",
      "Melden Sie sich einmal im Jahr statt alle 90 Tage",
    ],
    watch: [
      "Die Einkommensregeln sind streng, und es geht um Nachweise, nicht um Schätzungen",
      "Die steuerliche Behandlung unterscheidet sich je nach Kategorie (mit einem Steuerberater klären)",
      "Wenn Sie gerade so für ein Rentnervisum infrage kommen, ist das viel einfacher",
    ],
    faqs: [
      {
        q: "Wer bekommt das thailändische LTR-Visum?",
        a: "Wohlhabende Rentner, gut bezahlte Remote-Arbeiter, wohlhabende Investoren und hochqualifizierte Fachkräfte. Die meisten Kategorien verlangen etwa US$80.000 Jahreseinkommen (aktuelle Regeln auf der BOI-Seite prüfen).",
      },
      {
        q: "Darf ich mit einem LTR-Visum arbeiten?",
        a: "Die meisten Kategorien kommen mit einer digitalen Arbeitserlaubnis. Rentner brauchen für Arbeit eine gesonderte Ausnahme (vor dem Antrag prüfen).",
      },
      {
        q: "LTR oder Rentnervisum?",
        a: "Wenn Sie über 50 sind und die Einkommensgrenze des LTR deutlich überschreiten, spart Ihnen das LTR die jährlichen Verlängerungen. Wenn nicht, ist das Rentnervisum (฿800.000 oder ฿65.000 im Monat) viel einfacher.",
      },
    ],
    articles: ["visum-thailand-erfahrungen", "als-rentner-nach-pattaya"],
    askTopic: "visa",
    officialUrl: { label: "BOI LTR-Visum (offiziell)", url: "https://ltr.boi.go.th/" },
  },
  {
    id: "marriage",
    slug: "heiratsvisum",
    name: "Heiratsvisum",
    official: "Non-Immigrant O (verheiratet mit einer thailändischen Staatsangehörigen)",
    tagline: "Für alle, die mit einem Thai oder einer Thai verheiratet sind, in jedem Alter",
    metaTitle: "Heiratsvisum Thailand 2026: ฿400.000-Regel und Verlängerung in Pattaya | Shane Ruddle",
    description:
      "Das thailändische Heiratsvisum (Non-O auf Basis der Ehe) erklärt: ฿400.000 oder ฿40.000 im Monat, die Unterlagen, Hausbesuche und die jährliche Verlängerung in Pattaya.",
    fromShane: false,
    glance: {
      stay: "Jeweils 1 Jahr, hier verlängert",
      money: "฿400.000 auf einem Thai-Konto oder ฿40.000 Monatseinkommen",
      cost: "฿1.900 pro jährlicher Verlängerung",
      work: "Ja, mit Arbeitserlaubnis",
    },
    fit: "Sie mit einem Thai oder einer Thai verheiratet sind, was den nötigen Betrag halbiert",
    intro: [
      "Wenn Sie mit einer thailändischen Staatsangehörigen oder einem thailändischen Staatsangehörigen verheiratet sind, können Sie mit einem Non-Immigrant O auf Basis Ihrer Ehe bleiben, in jedem Alter. Der nachzuweisende Betrag ist halb so hoch wie bei einem Rentner.",
      "Es wird jeweils um ein Jahr bei der Immigration verlängert, und anders als beim Rentnervisum können Sie damit eine Arbeitserlaubnis bekommen.",
    ],
    suits: [
      "Alle, die rechtsgültig mit einer thailändischen Staatsangehörigen oder einem thailändischen Staatsangehörigen verheiratet sind",
      "Unter 50-Jährige, die kein Rentnervisum bekommen",
      "Leute, die hier vielleicht arbeiten möchten",
    ],
    requirements: [
      "Eine in Thailand registrierte Ehe, oder eine ausländische Ehe, die beim Bezirksamt registriert wurde (vor dem Antrag prüfen)",
      "฿400.000 auf einem thailändischen Bankkonto oder ฿40.000 Monatseinkommen (vor dem Antrag prüfen)",
      "Ausweis und Hausregister (Tabien Baan) Ihres Ehepartners sowie Fotos von Ihnen beiden zu Hause",
      "Die Immigration kann Sie zu Hause besuchen, um zu prüfen, ob Sie zusammenleben",
    ],
    steps: [
      "Registrieren Sie Ihre Ehe und lassen Sie die Unterlagen übersetzen",
      "Holen Sie sich ein Non-Immigrant-O-Visum und beantragen Sie dann die einjährige Verlängerung bei der Immigration in Jomtien (฿1.900)",
      "Gehen Sie gemeinsam mit Ihrem Ehepartner zum Termin",
      "Melden Sie alle 90 Tage Ihre Adresse und holen Sie vor jeder Reise ein Re-Entry-Permit",
    ],
    watch: [
      "Das Geld wird meist vor und nach jeder Verlängerung geprüft",
      "Wer ohne Re-Entry-Permit ausreist, verliert seine Verlängerung",
    ],
    faqs: [
      {
        q: "Wie viel Geld brauche ich für ein thailändisches Heiratsvisum?",
        a: "฿400.000 auf einem thailändischen Bankkonto oder ein Einkommen von ฿40.000 im Monat (Stand Oktober 2026, vor dem Antrag prüfen).",
      },
      {
        q: "Darf ich mit einem Heiratsvisum arbeiten?",
        a: "Ja, mit Arbeitserlaubnis. Das ist einer der großen Vorteile gegenüber dem Rentnervisum.",
      },
      {
        q: "Gibt es eine Altersgrenze für das Heiratsvisum?",
        a: "Nein. Anders als beim Rentnervisum gibt es kein Mindestalter.",
      },
    ],
    articles: ["visum-thailand-erfahrungen", "bankkonto-thailand-auslaender"],
    askTopic: "visa",
    officialUrl: { label: "Thai e-Visa (offiziell)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "education",
    slug: "bildungsvisum",
    name: "Bildungs- und Guardian-Visum",
    official: "Non-Immigrant ED und Non-O (Erziehungsberechtigte eines Schülers)",
    tagline: "Für Studierende und Eltern von Kindern, die hier zur Schule gehen",
    metaTitle: "Bildungsvisum (ED) und Guardian-Visum Thailand 2026: Studierende und Schuleltern | Shane Ruddle",
    description:
      "Das thailändische ED-Visum für Studierende und das Non-O-Guardian-Visum für Eltern von Kindern an einer internationalen Schule in Pattaya: die ฿500.000-Regel und wie die Verlängerung läuft.",
    fromShane: false,
    glance: {
      stay: "Bis zu einem Jahr am Stück, solange Sie lernen",
      money: "Kurs- oder Schulgebühren. Eltern: etwa ฿500.000 auf einem Thai-Konto",
      cost: "Schul- oder Kursgebühren plus ฿1.900 pro Verlängerung",
      work: "Nein",
    },
    fit: "Sie hier lernen oder Ihre Kinder hier zur Schule bringen",
    intro: [
      "Studierende an einer thailändischen Universität, Sprachschule oder internationalen Schule können ein ED-Visum bekommen, gesponsert von der Schule.",
      "Wenn ein Kind hier mit einem ED-Visum zur Schule geht, kann ein Elternteil meist mit einem Non-O-Guardian-Visum bleiben, mit etwa ฿500.000 auf einem thailändischen Bankkonto (vor dem Antrag prüfen).",
    ],
    suits: [
      "Familien mit Kindern an einer internationalen Schule in Pattaya",
      "Leute, die richtig Thai lernen wollen",
      "Studierende",
    ],
    requirements: [
      "Eine Zusage einer Schule oder Universität, die das Visum sponsern kann",
      "Für Eltern: etwa ฿500.000 auf einem thailändischen Bankkonto auf Ihren Namen und das Schreiben der Schule des Kindes (vor dem Antrag prüfen)",
      "Meist nur ein Guardian-Visum pro Kind (vor dem Antrag prüfen)",
      "Sprachschüler: echte Anwesenheit, und die Immigration prüft das",
    ],
    steps: [
      "Melden Sie sich an und holen Sie sich die Visa-Unterlagen der Schule",
      "Beantragen Sie das ED-Visum (und das Guardian-Non-O) bei einer thailändischen Botschaft oder über die Schule",
      "Verlängern Sie bei der Immigration in Jomtien, solange der Kurs oder das Schuljahr läuft",
      "Melden Sie alle 90 Tage Ihre Adresse",
    ],
    watch: [
      "ED-Visa von Sprachschulen werden genau geprüft. Die Immigration kann Ihr Thai testen",
      "Mit einem ED- oder Guardian-Visum dürfen Sie nicht arbeiten",
    ],
    faqs: [
      {
        q: "Welches Visum braucht ein Elternteil, wenn das Kind in Pattaya zur Schule geht?",
        a: "Meist ein Non-O-Guardian-Visum auf Basis des ED-Visums des Kindes, mit etwa ฿500.000 auf einem thailändischen Bankkonto (aktuelle Regeln mit der Schule klären).",
      },
      {
        q: "Bekomme ich ein Visum, um Thai zu lernen?",
        a: "Ja. Lizenzierte Sprachschulen können ein ED-Visum sponsern, aber Sie müssen tatsächlich hingehen, und die Immigration prüft das.",
      },
      {
        q: "Darf ich mit einem Bildungsvisum arbeiten?",
        a: "Nein. Wenn Sie arbeiten möchten, brauchen Sie ein Non-B-Visum und eine Arbeitserlaubnis.",
      },
    ],
    articles: ["leben-in-pattaya"],
    askTopic: "family",
    officialUrl: { label: "Thai e-Visa (offiziell)", url: "https://www.thaievisa.go.th/" },
  },
  {
    id: "exempt",
    slug: "visumfreie-einreise",
    name: "Visumfreie Einreise (30 Tage)",
    official: "Visa Exemption bei der Ankunft",
    tagline: "Gut für Urlaub oder einen ersten Eindruck, nicht zum Leben hier",
    metaTitle: "Thailand: Visumfreie Einreise auf 30 Tage verkürzt (2026), was das für Pattaya bedeutet | Shane Ruddle",
    description:
      "Thailand hat den visumfreien Aufenthalt am 15. September 2026 von 60 auf 30 Tage verkürzt. Wie lange Sie ohne Visum in Pattaya bleiben können, die Verlängerung und die TDAC-Einreisekarte.",
    fromShane: false,
    glance: {
      stay: "30 Tage, plus eine Verlängerung um 30 Tage",
      money: "In der Praxis keiner",
      cost: "Kostenlos. ฿1.900 für die Verlängerung",
      work: "Nein",
    },
    fit: "Sie nur einen oder zwei Monate brauchen",
    intro: [
      "Mit den meisten westlichen Pässen, auch dem deutschen, österreichischen und Schweizer, können Sie ohne Visum einreisen. Seit dem 15. September 2026 wurde dieser Aufenthalt für die meisten Länder von 60 auf 30 Tage verkürzt (vor der Reise prüfen).",
      "Sie können meist einmal um bis zu 30 Tage bei der Immigration in Jomtien verlängern. Füllen Sie vor dem Flug online die Thailand Digital Arrival Card (TDAC) aus.",
    ],
    suits: [
      "Urlaub und ein erster Eindruck von Pattaya vor dem Umzug",
      "Wohnungen besichtigen oder Schulen kennenlernen, bevor Sie sich festlegen",
    ],
    requirements: [
      "Ein Reisepass eines berechtigten Landes mit mindestens 6 Monaten Gültigkeit",
      "Die Thailand Digital Arrival Card (TDAC), vor der Ankunft online ausgefüllt",
      "Ein Weiter- oder Rückflugticket kann verlangt werden",
    ],
    steps: [
      "Füllen Sie in den Tagen vor dem Flug online die TDAC aus",
      "Bei der Ankunft bekommen Sie einen Stempel für 30 Tage",
      "Wenn Sie länger brauchen, verlängern Sie einmal bei der Immigration in Jomtien (฿1.900)",
    ],
    watch: [
      "Wer ständig visumfrei ein- und ausreist, wird an der Grenze befragt",
      "Es ist kein Weg, hier zu leben. Wenn Sie bleiben wollen, wählen Sie vor der Reise ein richtiges Visum",
    ],
    faqs: [
      {
        q: "Wie lange darf ich ohne Visum in Thailand bleiben?",
        a: "Mit den meisten westlichen Pässen 30 Tage seit dem 15. September 2026 (vorher waren es 60), plus eine Verlängerung um bis zu 30 Tage. Prüfen Sie vor der Reise die Regeln für Ihr Land.",
      },
      {
        q: "Kann ich den visumfreien Aufenthalt in Pattaya verlängern?",
        a: "Meist einmal, um bis zu 30 Tage, bei der Immigration in Jomtien. Die Gebühr beträgt ฿1.900.",
      },
      {
        q: "Was ist die TDAC?",
        a: "Die Thailand Digital Arrival Card, ein Online-Formular, das jeder ausländische Besucher vor der Ankunft ausfüllt. Sie hat die alte Einreisekarte aus Papier ersetzt.",
      },
    ],
    articles: ["leben-in-pattaya"],
    askTopic: "visiting",
    officialUrl: { label: "TDAC (offiziell)", url: "https://tdac.immigration.go.th/" },
  },
];

export const visaDeBySlug = (slug: string) => VISAS_DE.find((v) => v.slug === slug);
export const visaDeById = (id: VisaId) => VISAS_DE.find((v) => v.id === id)!;

export const VISAS_META_DE = {
  title: "Welches Thailand-Visum passt zu mir? Kostenloser Visum-Finder (2026) | Shane Ruddle",
  description:
    "Sechs Fragen, und Sie wissen, welches Thailand-Visum passt: Rentnervisum, DTV, Thailand Privilege, LTR, Business, Heirat oder Bildung. Von einem Einwohner Pattayas seit 20 Jahren.",
};

export const VISAS_FAQS_DE = [
  {
    q: "Welches Visum ist das beste, um in Pattaya zu leben?",
    a: "Das hängt von Ihrem Alter ab und davon, was Sie hier machen wollen. Rentner ab 50 nutzen ein Rentnervisum, Remote-Arbeiter das DTV, und wer arbeitet oder ein Geschäft führt, braucht ein Non-B-Visum mit Arbeitserlaubnis.",
  },
  {
    q: "Was ist der größte Visa-Fehler?",
    a: "Schlechte Beratung, und am Ende ein Visum, das nicht zu Ihrer Situation passt. Überlegen Sie, was Sie in ein paar Jahren hier vielleicht machen möchten, nicht nur jetzt.",
  },
  {
    q: "Wie lange darf ich ohne Visum in Thailand bleiben?",
    a: "Mit deutschem, österreichischem oder Schweizer Pass und den meisten anderen westlichen Pässen 30 Tage seit dem 15. September 2026, vorher waren es 60. Meist können Sie einmal um bis zu 30 Tage verlängern.",
  },
  {
    q: "Brauche ich in Pattaya eine Visa-Agentur?",
    a: "Sie müssen keine nutzen, aber ich habe es immer getan. Davon gibt es in der Stadt genug, und sie machen das Ganze sehr viel weniger mühsam.",
  },
];

// ---- Finder: same question and option ids as the English finder, German labels ----

type QuestionCopy = { question: string; hint?: string; options: Record<string, string> };

const QUESTION_DE: Record<string, QuestionCopy> = {
  purpose: {
    question: "Was ist der Hauptgrund für Ihren Umzug?",
    options: {
      retire: "Ruhestand",
      remote: "Online-Arbeit für Kunden oder eine Firma im Ausland",
      work: "Ein Job oder mein eigenes Geschäft in Thailand",
      spouse: "Ich bin mit einem Thai oder einer Thai verheiratet",
      school: "Studium, oder meine Kinder gehen hier zur Schule",
      holiday: "Ein langer Urlaub, oder erst einmal ausprobieren",
    },
  },
  age: { question: "Wie alt sind Sie?", options: { under50: "Unter 50", over50: "50 oder älter" } },
  stay: {
    question: "Wie lange möchten Sie bleiben?",
    options: { short: "Ein oder zwei Monate", half: "Bis zu sechs Monate am Stück", long: "Ein Jahr oder länger. Ich ziehe her" },
  },
  money: {
    question: "Was könnten Sie an Ersparnissen oder Einkommen nachweisen?",
    hint: "Ungefähr. Die meisten Visa prüfen das eine oder das andere. (฿500.000 sind etwa 13.000 €.)",
    options: {
      low: "Unter ฿500.000",
      mid: "฿500.000 bis ฿800.000",
      high: "฿800.000+ oder ฿65.000 im Monat",
      wealthy: "US$80.000+ im Jahr oder US$1 Mio. Vermögen",
    },
  },
  future: {
    question: "Möchten Sie in den nächsten Jahren vielleicht hier arbeiten oder ein Geschäft gründen?",
    hint: "Diese Frage vergessen die meisten.",
    options: { yes: "Ja", maybe: "Vielleicht", no: "Nein" },
  },
  pay: {
    question: "Würden Sie ฿650.000 oder mehr zahlen, um sich den meisten Papierkram zu sparen?",
    options: { yes: "Ja, wenn es mir den Aufwand erspart", no: "Nein, dann lieber den Papierkram" },
  },
};

export const VISA_QUESTIONS_DE = VISA_QUESTIONS.map((q) => ({
  id: q.id,
  question: QUESTION_DE[q.id].question,
  hint: QUESTION_DE[q.id].hint,
  options: q.options.map((o) => ({ id: o.id, label: QUESTION_DE[q.id].options[o.id] ?? o.label })),
}));

// The English finder's personal notes, in German. Keyed by the English text so the logic stays in one place.
const NOTES_DE: Record<string, string> = {
  "You said you might want to work or start a business here. Thailand Privilege can't be converted into a work visa. I know someone who paid close to a million baht and had to walk away from it.":
    "Sie haben gesagt, dass Sie hier vielleicht arbeiten oder ein Geschäft gründen möchten. Thailand Privilege lässt sich nicht in ein Arbeitsvisum umwandeln. Ich kenne jemanden, der fast eine Million Baht bezahlt hat und es aufgeben musste.",
  "You said you might want to work for a Thai company or start a business here. This visa doesn't allow that, so when the time comes you'll need a Non-B visa and a work permit through a Thai company.":
    "Sie haben gesagt, dass Sie vielleicht für eine thailändische Firma arbeiten oder hier ein Geschäft gründen möchten. Dieses Visum erlaubt das nicht. Wenn es so weit ist, brauchen Sie ein Non-B-Visum und eine Arbeitserlaubnis über eine thailändische Firma.",
  "You'd pay to skip the paperwork, but you qualify for a retirement visa at ฿1,900 a year. With a good agent there's very little hassle.":
    "Sie würden zahlen, um sich den Papierkram zu sparen, aber Sie bekommen ein Rentnervisum für ฿1.900 im Jahr. Mit einer guten Agentur ist der Aufwand sehr gering.",
  "The DTV needs around ฿500,000 in savings, so you'd need to build that up first.":
    "Für das DTV brauchen Sie etwa ฿500.000 an Ersparnissen. Die müssten Sie zuerst ansparen.",
  "A retirement visa needs ฿800,000 in a Thai bank or ฿65,000 a month income, so you'd need to build that up first.":
    "Für ein Rentnervisum brauchen Sie ฿800.000 auf einem thailändischen Konto oder ฿65.000 Monatseinkommen. Das müssten Sie zuerst aufbauen.",
  "You're short of the ฿800,000 for a retirement visa. A mix of savings and monthly income can count, so ask before you rule it out.":
    "Ihnen fehlt etwas zu den ฿800.000 für ein Rentnervisum. Eine Kombination aus Ersparnissen und Monatseinkommen kann zählen. Fragen Sie also, bevor Sie es ausschließen.",
};

export function recommendVisaDe(answers: VisaAnswers) {
  const r = recommendVisa(answers);
  return {
    best: visaDeById(r.best.id),
    runnerUp: visaDeById(r.runnerUp.id),
    notes: r.notes.map((n) => NOTES_DE[n] ?? n),
    /** English result, for the summary Shane receives with a question. */
    en: r,
  };
}
