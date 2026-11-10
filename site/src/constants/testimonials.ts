export interface CoachTestimonial {
  quote: string;
  name: string;
  role: string;
  lang: "FR" | "DE" | "IT";
  nativeLanguage: "fr-CH" | "de-CH" | "it-CH";
}

// Original coach-language content, shared by every site locale.
export const COACH_TESTIMONIALS: CoachTestimonial[] = [
  {
    quote: "Endlich ein Tool, das unsere Sprache spricht — buchstäblich. Ich verwalte meine 28 Athleten auf Deutsch, meine Kollegen aus der Romandie auf Französisch. Revolutionär.",
    name: "Markus B.",
    role: "Sprint-Trainer, Zürich",
    lang: "DE",
    nativeLanguage: "de-CH",
  },
  {
    quote: "J'ai jeté mon carnet papier après 15 ans. La séance est envoyée avant que j'arrive au vestiaire. Mes athlètes sont déjà prêts.",
    name: "Sophie M.",
    role: "Coach demi-fond, Lausanne",
    lang: "FR",
    nativeLanguage: "fr-CH",
  },
  {
    quote: "Finalmente un'app che capisce l'atletica svizzera. Ho invitato tutto il mio gruppo in 5 minuti.",
    name: "Marco R.",
    role: "Allenatore salti, Lugano",
    lang: "IT",
    nativeLanguage: "it-CH",
  },
];
