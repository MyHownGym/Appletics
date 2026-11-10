import { COACH_TESTIMONIALS } from "@/constants/testimonials";
import { OFFER_COPY } from "@/constants/offers";
import { PRICING_COPY } from "@/constants/pricingCopy";

export type Language = "fr" | "de" | "it";

export const translations = {
  fr: {
    nav: {
      features: "Fonctionnalités",
      pricing: "Tarifs",
      testimonials: "Témoignages",
      download: "Rejoindre le programme",
      openApp: "Ouvrir l'app",
      madeIn: "Made in Switzerland",
    },
    hero: {
      badge: "Lancement le 1er décembre · Web app",
      headline: "Moins d'admin.",
      headline2: "Plus de piste.",
      sub: "L'app de coaching pensée pour l'athlétisme suisse. Planifiez vos séances, suivez vos athlètes, gérez vos compétitions — le tout en 2 minutes.",
      ctaPrimary: "Devenir coach / club fondateur",
      ctaSecondary: "Voir la démo",
      trustedBy: "Déjà utilisé par des coachs suisses",
      stats: [
        { value: "524", label: "clubs en Suisse" },
        { value: "3", label: "langues nationales" },
        { value: "Web", label: "iPhone · iPad · Android · Ordi" },
      ],
    },
    features: {
      badge: "Fonctionnalités",
      title: "Tout ce dont un coach a besoin",
      subtitle: "Conçu avec et pour les coachs de club suisses — pas une app de fitness générique.",
      items: [
        {
          icon: "calendar",
          title: "Plans d'entraînement",
          desc: "Créez et envoyez votre séance à tout le groupe en 2 minutes. Fini l'Excel et les PDFs.",
        },
        {
          icon: "users",
          title: "Suivi des athlètes",
          desc: "Fiches athlètes, records personnels et historique au même endroit. Graphiques individuels dès la formule Pro.",
        },
        {
          icon: "trophy",
          title: "Gestion des compétitions",
          desc: "Enregistrez vos compétitions, retrouvez les résultats et suivez les records personnels de vos athlètes.",
        },
        {
          icon: "message-circle",
          title: "Communication de groupe",
          desc: "Remplacez vos 40 WhatsApp par une seule notification structurée depuis l'app.",
        },
        {
          icon: "bar-chart-2",
          title: "Analyses avancées",
          desc: "Graphiques individuels dès Pro. Comparaisons de saisons et analyses d’équipe avec Elite.",
        },
        {
          icon: "shield",
          title: "Données en Suisse",
          desc: "Hébergement conforme nLPD, données de vos athlètes protégées sur sol suisse.",
        },
      ],
    },
    howItWorks: {
      badge: "Comment ça marche",
      title: "De l'inscription à la piste en 3 étapes",
      steps: [
        {
          num: "01",
          title: "Créez votre profil coach",
          desc: "Inscrivez-vous, définissez votre rôle (coach, président, chef technique) et invitez vos athlètes.",
        },
        {
          num: "02",
          title: "Planifiez vos séances",
          desc: "Construisez vos plans d'entraînement et envoyez-les en un tap. Le groupe reçoit une notification.",
        },
        {
          num: "03",
          title: "Suivez la progression",
          desc: "Consultez les performances, chronos et sauts de chaque athlète. Ajustez en temps réel.",
        },
      ],
    },
    testimonials: {
      badge: "Témoignages",
      title: "Les coachs suisses en parlent",
      items: COACH_TESTIMONIALS,
    },
    pricing: PRICING_COPY.fr,
    download: {
      badge: "Lancement le 1er décembre 2026",
      title: "Prêt à coacher autrement ?",
      subtitle: "Devenez coach ou club fondateur et bénéficiez de 6 mois de formule Premium offerts.",
      appStore: "Ouvrir l'app",
      googlePlay: "Sans téléchargement : sur iPhone, iPad, Android et ordinateur. Ajoute-la à ton écran d'accueil en 10 secondes.",
      founders: "Programme Coachs & Clubs Fondateurs",
      foundersDesc: "Rejoignez les premiers coachs et clubs fondateurs — 6 mois de formule Premium offerts.",
    },
    footer: {
      tagline: "L'app de coaching pensée pour l'athlétisme suisse.",
      links: ["Fonctionnalités", "Tarifs", "Contact", "Mentions légales"],
      social: "Suivez-nous",
      rights: "© 2026 Appletics. Tous droits réservés.",
      madeWith: "Fait avec ❤️ en Suisse",
    },
  },

  de: {
    nav: {
      features: "Funktionen",
      pricing: "Preise",
      testimonials: "Referenzen",
      download: "Am Programm teilnehmen",
      openApp: "App öffnen",
      madeIn: "Made in Switzerland",
    },
    hero: {
      badge: "Start am 1. Dezember · Web-App",
      headline: "Weniger Büro.",
      headline2: "Mehr Bahn.",
      sub: "Die Coaching-App für die Schweizer Leichtathletik. Trainings planen, Athleten verfolgen, Wettkämpfe verwalten — alles in 2 Minuten.",
      ctaPrimary: "Gründer-Coach / Verein werden",
      ctaSecondary: "Demo ansehen",
      trustedBy: "Bereits von Schweizer Coaches genutzt",
      stats: [
        { value: "524", label: "Vereine in der Schweiz" },
        { value: "3", label: "Landessprachen" },
        { value: "Web", label: "iPhone · iPad · Android · PC" },
      ],
    },
    features: {
      badge: "Funktionen",
      title: "Alles, was ein Coach braucht",
      subtitle: "Entwickelt mit und für Schweizer Vereinstrainer — keine generische Fitness-App.",
      items: [
        {
          icon: "calendar",
          title: "Trainingspläne",
          desc: "Erstellen und versenden Sie Ihre Einheit in 2 Minuten an die ganze Gruppe. Schluss mit Excel und PDFs.",
        },
        {
          icon: "users",
          title: "Athleten-Tracking",
          desc: "Athletenprofile, persönliche Bestleistungen und Ergebnisverlauf an einem Ort. Individuelle Diagramme ab Pro.",
        },
        {
          icon: "trophy",
          title: "Wettkampfverwaltung",
          desc: "Wettkämpfe speichern, Ergebnisse einsehen und persönliche Bestleistungen Ihrer Athleten verfolgen.",
        },
        {
          icon: "message-circle",
          title: "Gruppenkommunikation",
          desc: "Ersetzen Sie Ihre 40 WhatsApp-Nachrichten durch eine strukturierte App-Benachrichtigung.",
        },
        {
          icon: "bar-chart-2",
          title: "Erweiterte Analysen",
          desc: "Individuelle Diagramme ab Pro. Saisonvergleiche und Teamanalysen mit Elite.",
        },
        {
          icon: "shield",
          title: "Daten in der Schweiz",
          desc: "nDSG-konformes Hosting, Athletendaten auf Schweizer Boden geschützt.",
        },
      ],
    },
    howItWorks: {
      badge: "So funktioniert es",
      title: "In 3 Schritten auf der Bahn",
      steps: [
        {
          num: "01",
          title: "Coach-Profil erstellen",
          desc: "Registrieren, Rolle festlegen (Trainer, Präsident, Technischer Leiter) und Athleten einladen.",
        },
        {
          num: "02",
          title: "Trainings planen",
          desc: "Trainingspläne erstellen und mit einem Tap versenden. Die Gruppe erhält eine Benachrichtigung.",
        },
        {
          num: "03",
          title: "Fortschritt verfolgen",
          desc: "Leistungen, Zeiten und Sprünge jedes Athleten einsehen. In Echtzeit anpassen.",
        },
      ],
    },
    testimonials: {
      badge: "Referenzen",
      title: "Schweizer Coaches berichten",
      items: COACH_TESTIMONIALS,
    },
    pricing: PRICING_COPY.de,
    download: {
      badge: "Start am 1. Dezember 2026",
      title: "Bereit, anders zu coachen?",
      subtitle: "Werden Sie Gründer-Coach oder Gründer-Verein und erhalten Sie 6 Monate Premium gratis.",
      appStore: "App öffnen",
      googlePlay: "Ohne Download: auf iPhone, iPad, Android und Computer. In 10 Sekunden auf den Startbildschirm.",
      founders: "Gründer-Coaches & Gründer-Vereine",
      foundersDesc: "Werden Sie Gründer-Coach oder Gründer-Verein — 6 Monate Premium gratis.",
    },
    footer: {
      tagline: "Die Coaching-App für die Schweizer Leichtathletik.",
      links: ["Funktionen", "Preise", "Kontakt", "Impressum"],
      social: "Folgen Sie uns",
      rights: "© 2026 Appletics. Alle Rechte vorbehalten.",
      madeWith: "Mit ❤️ in der Schweiz gemacht",
    },
  },

  it: {
    nav: {
      features: "Funzionalità",
      pricing: "Prezzi",
      testimonials: "Testimonianze",
      download: "Unisciti al programma",
      openApp: "Apri l'app",
      madeIn: "Made in Switzerland",
    },
    hero: {
      badge: "Lancio il 1° dicembre · Web app",
      headline: "Meno burocrazia.",
      headline2: "Più pista.",
      sub: "L'app di coaching pensata per l'atletica svizzera. Pianifica gli allenamenti, segui i tuoi atleti, gestisci le gare — tutto in 2 minuti.",
      ctaPrimary: "Diventa coach / club fondatore",
      ctaSecondary: "Guarda la demo",
      trustedBy: "Già usato da coach svizzeri",
      stats: [
        { value: "524", label: "club in Svizzera" },
        { value: "3", label: "lingue nazionali" },
        { value: "Web", label: "iPhone · iPad · Android · PC" },
      ],
    },
    features: {
      badge: "Funzionalità",
      title: "Tutto ciò di cui un coach ha bisogno",
      subtitle: "Progettato con e per i coach di club svizzeri — non una generica app di fitness.",
      items: [
        {
          icon: "calendar",
          title: "Piani di allenamento",
          desc: "Crea e invia la tua sessione a tutto il gruppo in 2 minuti. Basta Excel e PDF.",
        },
        {
          icon: "users",
          title: "Tracciamento atleti",
          desc: "Schede atleti, record personali e storico dei risultati in un unico posto. Grafici individuali da Pro.",
        },
        {
          icon: "trophy",
          title: "Gestione gare",
          desc: "Salva le gare, consulta i risultati e segui i record personali dei tuoi atleti.",
        },
        {
          icon: "message-circle",
          title: "Comunicazione di gruppo",
          desc: "Sostituisci i tuoi 40 WhatsApp con una sola notifica strutturata dall'app.",
        },
        {
          icon: "bar-chart-2",
          title: "Analisi avanzate",
          desc: "Grafici individuali da Pro. Confronti tra stagioni e analisi della squadra con Elite.",
        },
        {
          icon: "shield",
          title: "Dati in Svizzera",
          desc: "Hosting conforme nLPD, dati dei tuoi atleti protetti su suolo svizzero.",
        },
      ],
    },
    howItWorks: {
      badge: "Come funziona",
      title: "Dall'iscrizione alla pista in 3 passi",
      steps: [
        {
          num: "01",
          title: "Crea il tuo profilo coach",
          desc: "Registrati, definisci il tuo ruolo (coach, presidente, responsabile tecnico) e invita i tuoi atleti.",
        },
        {
          num: "02",
          title: "Pianifica gli allenamenti",
          desc: "Costruisci i piani di allenamento e inviali con un tap. Il gruppo riceve una notifica.",
        },
        {
          num: "03",
          title: "Segui i progressi",
          desc: "Consulta le prestazioni, i tempi e i salti di ogni atleta. Adatta in tempo reale.",
        },
      ],
    },
    testimonials: {
      badge: "Testimonianze",
      title: "I coach svizzeri ne parlano",
      items: COACH_TESTIMONIALS,
    },
    pricing: PRICING_COPY.it,
    download: {
      badge: "Lancio il 1° dicembre 2026",
      title: "Pronto a fare coaching diversamente?",
      subtitle: "Diventa coach o club fondatore e ottieni 6 mesi di Premium in regalo.",
      appStore: "Apri l'app",
      googlePlay: "Senza download: su iPhone, iPad, Android e computer. Aggiungila alla schermata Home in 10 secondi.",
      founders: "Programma Coach & Club Fondatori",
      foundersDesc: "Diventa coach o club fondatore — 6 mesi di Premium in regalo.",
    },
    footer: {
      tagline: "L'app di coaching pensata per l'atletica svizzera.",
      links: ["Funzionalità", "Prezzi", "Contatto", "Note legali"],
      social: "Seguici",
      rights: "© 2026 Appletics. Tutti i diritti riservati.",
      madeWith: "Fatto con ❤️ in Svizzera",
    },
  },
};
