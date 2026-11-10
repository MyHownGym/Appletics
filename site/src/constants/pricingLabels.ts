import type { Language } from "@/constants/translations";
import type { PricingLabels } from "@/types/pricing";

export const PRICING_LABELS: Record<Language, PricingLabels> = {
  fr: {
    capacities: { coaches: "Coachs actifs ou en attente", athletes: "Fiches athlètes", plans: "Plans enregistrés", competitions: "Compétitions enregistrées", discussions: "Groupes de discussion" },
    features: { calendar: "Calendrier et séances", records: "Records personnels (PBs)", history: "Historique des résultats", charts: "Graphiques individuels · toutes les épreuves", seasons: "Comparaison détaillée entre saisons", team: "Analyses équipe · charge, groupes, tendances", pdf: "Export PDF · plans, résultats, fiches", dashboard: "Tableau de bord et annuaire club" },
    included: "Inclus", excluded: "Non inclus", unlimited: "Illimité", pending: "À confirmer", details: "Détail des fonctionnalités",
    common: "Calendrier, séances, records personnels et historique des résultats inclus dans chaque formule.",
    quotas: "Quotas partagés à l’échelle du compte ou du club, pas par coach. Tous les éléments enregistrés comptent, y compris les archives.",
    committee: "Accès comité prévu : 1 membre administrateur.", pendingCoaches: "Nombre de coachs Club Pro à confirmer : valeur actuelle conservée.",
  },
  de: {
    capacities: { coaches: "Aktive oder eingeladene Coaches", athletes: "Athletenprofile", plans: "Gespeicherte Pläne", competitions: "Gespeicherte Wettkämpfe", discussions: "Diskussionsgruppen" },
    features: { calendar: "Kalender und Trainingseinheiten", records: "Persönliche Bestleistungen (PBs)", history: "Ergebnisverlauf", charts: "Individuelle Diagramme · alle Disziplinen", seasons: "Detaillierter Saisonvergleich", team: "Teamanalysen · Belastung, Gruppen, Trends", pdf: "PDF-Export · Pläne, Ergebnisse, Profile", dashboard: "Vereins-Dashboard und Mitgliederverzeichnis" },
    included: "Inklusive", excluded: "Nicht enthalten", unlimited: "Unbegrenzt", pending: "Zu bestätigen", details: "Alle Funktionen ansehen",
    common: "Kalender, Trainingseinheiten, persönliche Bestleistungen und Ergebnisverlauf sind in jedem Abo enthalten.",
    quotas: "Die Kontingente gelten gemeinsam pro Konto oder Verein, nicht pro Coach. Alle gespeicherten Inhalte zählen, auch archivierte.",
    committee: "Geplanter Vorstandszugang: 1 Mitglied mit Administratorrechten.", pendingCoaches: "Coach-Anzahl für Club Pro noch zu bestätigen: bisheriger Wert beibehalten.",
  },
  it: {
    capacities: { coaches: "Coach attivi o in attesa", athletes: "Schede atleti", plans: "Piani salvati", competitions: "Gare salvate", discussions: "Gruppi di discussione" },
    features: { calendar: "Calendario e sessioni", records: "Record personali (PB)", history: "Storico dei risultati", charts: "Grafici individuali · tutte le discipline", seasons: "Confronto dettagliato tra stagioni", team: "Analisi squadra · carico, gruppi, tendenze", pdf: "Esportazione PDF · piani, risultati, schede", dashboard: "Dashboard e elenco del club" },
    included: "Incluso", excluded: "Non incluso", unlimited: "Illimitato", pending: "Da confermare", details: "Dettaglio delle funzionalità",
    common: "Calendario, sessioni, record personali e storico dei risultati inclusi in ogni piano.",
    quotas: "Le quote sono condivise a livello di account o club, non per coach. Tutti gli elementi salvati contano, compresi quelli archiviati.",
    committee: "Accesso comitato previsto: 1 membro amministratore.", pendingCoaches: "Numero di coach Club Pro da confermare: valore attuale mantenuto.",
  },
};
