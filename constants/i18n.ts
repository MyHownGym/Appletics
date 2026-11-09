// Powered by OnSpace.AI
// Public language support: French, German and Italian only.

export type Language = 'fr' | 'de' | 'it';

export const LANGUAGES: { code: Language; label: string; flag: string; nativeName: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },

];

export type TranslationKey =
  // Nav
  | 'nav_home' | 'nav_plans' | 'nav_meets' | 'nav_chat' | 'nav_profile'
  // Common
  | 'add' | 'cancel' | 'save' | 'delete' | 'edit' | 'close' | 'back'
  | 'search' | 'loading' | 'error' | 'success' | 'all' | 'none' | 'see_all'
  | 'send' | 'optional' | 'required' | 'select' | 'confirm' | 'invite'
  // Home
  | 'good_morning' | 'todays_training' | 'upcoming_meets' | 'quick_actions'
  | 'rest_day' | 'no_meets' | 'new_plan' | 'add_meet' | 'messages' | 'athletes'
  // Plans
  | 'training_plans' | 'active_plans' | 'add_plan' | 'no_plans' | 'phase'
  | 'weeks' | 'sessions' | 'plan_title' | 'plan_description' | 'group'
  | 'start_date' | 'end_date' | 'create_plan' | 'plan_detail'
  // Competitions
  | 'competitions' | 'upcoming' | 'completed' | 'cancelled' | 'results'
  | 'event_wins' | 'pbs_set' | 'meets_done' | 'venue' | 'location'
  | 'team_score' | 'team_rank' | 'no_meets_found' | 'add_competition'
  | 'live_results' | 'swiss_athletics_live'
  // Chat
  | 'chat_messages' | 'all_caught_up' | 'type_message' | 'no_channels'
  | 'staff' | 'groups' | 'admin'
  // Profile & Athletes
  | 'total' | 'coaches' | 'profile_photo' | 'photo_choose' | 'photo_change' | 'photo_remove' | 'photo_permission' | 'photo_error'
  | 'profile' | 'all_athletes' | 'add_athlete' | 'invite_athlete' | 'edit_profile'
  | 'athlete_name' | 'athlete_events' | 'athlete_group' | 'athlete_status'
  | 'active' | 'injured' | 'inactive' | 'squad_by_group'
  | 'personal_bests' | 'training_plans_cap' | 'recent_results'
  | 'wins' | 'pbs' | 'no_results' | 'no_plans_assigned'
  | 'invite_via_email' | 'invite_via_sms' | 'copy_link' | 'invite_message'
  | 'manual_entry' | 'or_invite' | 'athlete_added' | 'send_invite'
  | 'delete_athlete' | 'delete_athlete_confirm' | 'athlete_deleted'
  // Edit profile
  | 'coach_name' | 'coach_club' | 'coach_role' | 'coach_email' | 'profile_saved'
  // Swiss Athletics
  | 'fetch_results' | 'fetching' | 'no_results_found' | 'import_all'
  | 'results_found' | 'imported' | 'import'
  // Settings
  | 'settings' | 'language' | 'select_language' | 'appearance' | 'notifications'
  // Event groups
  | 'sprints' | 'distance' | 'field' | 'hurdles' | 'relay' | 'jumps' | 'throws'
  // Athlete form
  | 'enter_name' | 'enter_events' | 'events_hint' | 'status_label'
  | 'pb_label' | 'add_pb' | 'event_label' | 'performance_label'
  | 'plan_description_duration' | 'phase_intensity'
  // Group labels
  | 'group_all' | 'group_sprints' | 'group_distance' | 'group_hurdles'
  | 'group_jumps' | 'group_throws' | 'group_relay'
  // Intensity labels
  | 'intensity_easy' | 'intensity_moderate' | 'intensity_hard' | 'intensity_race' | 'intensity_rest'
  // Day labels
  | 'day_mon' | 'day_tue' | 'day_wed' | 'day_thu' | 'day_fri' | 'day_sat' | 'day_sun';

type Translations = Record<Language, Record<TranslationKey, string>>;

// Legacy catalogues are private; they cannot be selected or used as fallback.
const bundledTranslations: Record<string, Record<TranslationKey, string>> = {
  en: {
    nav_home: 'Home', nav_plans: 'Plans', nav_meets: 'Meets', nav_chat: 'Chat', nav_profile: 'Profile',
    add: 'Add', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit', close: 'Close', back: 'Back',
    search: 'Search', loading: 'Loading...', error: 'Error', success: 'Success', all: 'All', none: 'None', see_all: 'See All',
    send: 'Send', optional: 'Optional', required: 'Required', select: 'Select', confirm: 'Confirm', invite: 'Invite',
    good_morning: 'Good morning,', todays_training: 'Today', upcoming_meets: 'Upcoming Meets', quick_actions: 'Quick Actions',
    rest_day: 'Rest day or no sessions scheduled', no_meets: 'No upcoming meets scheduled',
    new_plan: 'New Plan', add_meet: 'Add Meet', messages: 'Messages', athletes: 'Athletes',
    training_plans: 'Training Plans', active_plans: 'active plans', add_plan: 'Add plan', no_plans: 'No plans for this group',
    phase: 'Phase', weeks: 'weeks', sessions: 'sessions', plan_title: 'Plan Title', plan_description: 'Description',
    group: 'Group', start_date: 'Start Date', end_date: 'End Date', create_plan: 'Create Plan', plan_detail: 'Plan Detail',
    competitions: 'Competitions', upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled', results: 'Results',
    event_wins: 'Event Wins', pbs_set: 'PBs Set', meets_done: 'Completed', venue: 'Venue', location: 'Location',
    team_score: 'Team Score', team_rank: 'Team Rank', no_meets_found: 'No meets found', add_competition: 'Add meet',
    live_results: 'Live Results', swiss_athletics_live: 'Swiss Athletics Best Lists',
    chat_messages: 'Messages', all_caught_up: 'All caught up', type_message: 'Type a message...', no_channels: 'No channels',
    staff: 'Staff', groups: 'Groups', admin: 'Admin',
    total: 'Total', coaches: 'Coaches', profile_photo: 'Profile photo', photo_choose: 'Add a photo', photo_change: 'Change photo', photo_remove: 'Remove photo', photo_permission: 'Allow photo library access in device settings.', photo_error: 'Unable to save this photo. Please try another image.',
    profile: 'Profile', all_athletes: 'All Athletes', add_athlete: 'Add Athlete', invite_athlete: 'Invite Athlete', edit_profile: 'Edit Profile',
    athlete_name: 'Athlete Name', athlete_events: 'Events', athlete_group: 'Group', athlete_status: 'Status',
    active: 'Active', injured: 'Injured', inactive: 'Inactive', squad_by_group: 'Squad by Group',
    personal_bests: 'Personal Bests', training_plans_cap: 'Training Plans', recent_results: 'Recent Results',
    wins: 'Wins', pbs: 'PBs', no_results: 'No results recorded', no_plans_assigned: 'Not assigned to any plan',
    invite_via_email: 'Invite via Email', invite_via_sms: 'Invite via SMS', copy_link: 'Copy Link', invite_message: 'Appletics invitation',
    manual_entry: 'Add Manually', or_invite: 'or send an invitation', athlete_added: 'Athlete added!', send_invite: 'Send Invite',
    delete_athlete: 'Delete Athlete', delete_athlete_confirm: 'This will permanently remove this athlete. Continue?', athlete_deleted: 'Athlete deleted',
    coach_name: 'Full Name', coach_club: 'Club', coach_role: 'Role', coach_email: 'Email', profile_saved: 'Profile saved!',
    fetch_results: 'Fetch results', fetching: 'Searching portal...', no_results_found: 'No results found', import_all: 'Import All',
    results_found: 'results found', imported: 'Imported', import: 'Import',
    settings: 'Settings', language: 'Language', select_language: 'Select Language', appearance: 'Appearance', notifications: 'Notifications',
    sprints: 'Sprints', distance: 'Distance', field: 'Field', hurdles: 'Hurdles', relay: 'Relay', jumps: 'Jumps', throws: 'Throws',
    enter_name: 'Full name', enter_events: 'e.g. 100m, 200m', events_hint: 'Separate events with commas',
    status_label: 'Status', pb_label: 'Personal Bests', add_pb: 'Add PB', event_label: 'Event', performance_label: 'Performance',
    plan_description_duration: 'Duration (min)', phase_intensity: 'Intensity',
    group_all: 'All', group_sprints: 'Sprints', group_distance: 'Distance', group_hurdles: 'Hurdles',
    group_jumps: 'Jumps', group_throws: 'Throws', group_relay: 'Relay',
    intensity_easy: 'Easy', intensity_moderate: 'Moderate', intensity_hard: 'Hard', intensity_race: 'Race Pace', intensity_rest: 'Rest',
    day_mon: 'Mon', day_tue: 'Tue', day_wed: 'Wed', day_thu: 'Thu', day_fri: 'Fri', day_sat: 'Sat', day_sun: 'Sun',
  },
  fr: {
    nav_home: 'Accueil', nav_plans: 'Plans', nav_meets: 'Compétitions', nav_chat: 'Chat', nav_profile: 'Profil',
    add: 'Ajouter', cancel: 'Annuler', save: 'Enregistrer', delete: 'Supprimer', edit: 'Modifier', close: 'Fermer', back: 'Retour',
    search: 'Rechercher', loading: 'Chargement...', error: 'Erreur', success: 'Succès', all: 'Tout', none: 'Aucun', see_all: 'Voir tout',
    send: 'Envoyer', optional: 'Optionnel', required: 'Requis', select: 'Sélectionner', confirm: 'Confirmer', invite: 'Inviter',
    good_morning: 'Bonjour,', todays_training: "Aujourd'hui", upcoming_meets: 'Compétitions à venir', quick_actions: 'Actions rapides',
    rest_day: 'Jour de repos ou aucune séance planifiée', no_meets: 'Aucune compétition à venir',
    new_plan: 'Nouveau plan', add_meet: 'Ajouter une compétition', messages: 'Messages', athletes: 'Athlètes',
    training_plans: "Plans d'entraînement", active_plans: 'plans actifs', add_plan: 'Ajouter un plan', no_plans: 'Aucun plan pour ce groupe',
    phase: 'Phase', weeks: 'semaines', sessions: 'séances', plan_title: 'Titre du plan', plan_description: 'Description',
    group: 'Groupe', start_date: 'Date de début', end_date: 'Date de fin', create_plan: 'Créer le plan', plan_detail: 'Détail du plan',
    competitions: 'Compétitions', upcoming: 'À venir', completed: 'Terminée', cancelled: 'Annulée', results: 'Résultats',
    event_wins: 'Victoires', pbs_set: 'Records perso.', meets_done: 'Terminées', venue: 'Lieu', location: 'Localisation',
    team_score: 'Score équipe', team_rank: 'Classement', no_meets_found: 'Aucune compétition', add_competition: 'Ajouter',
    live_results: 'Résultats en direct', swiss_athletics_live: 'Swiss Athletics — listes des meilleurs',
    chat_messages: 'Messages', all_caught_up: 'Tout lu', type_message: 'Écrire un message...', no_channels: 'Aucun canal',
    staff: 'Staff', groups: 'Groupes', admin: 'Admin',
    total: 'Total', coaches: 'Coachs', profile_photo: 'Photo de profil', photo_choose: 'Ajouter une photo', photo_change: 'Changer la photo', photo_remove: 'Retirer la photo', photo_permission: 'Autorisez l’accès aux photos dans les réglages de l’appareil.', photo_error: 'Impossible d’enregistrer cette photo. Essayez une autre image.',
    profile: 'Profil', all_athletes: 'Tous les athlètes', add_athlete: 'Ajouter un athlète', invite_athlete: 'Inviter un athlète', edit_profile: 'Modifier le profil',
    athlete_name: "Nom de l'athlète", athlete_events: 'Épreuves', athlete_group: 'Groupe', athlete_status: 'Statut',
    active: 'Actif', injured: 'Blessé', inactive: 'Inactif', squad_by_group: 'Équipe par groupe',
    personal_bests: 'Records personnels', training_plans_cap: "Plans d'entraînement", recent_results: 'Résultats récents',
    wins: 'Victoires', pbs: 'Records', no_results: 'Aucun résultat enregistré', no_plans_assigned: 'Aucun plan assigné',
    invite_via_email: 'Inviter par e-mail', invite_via_sms: 'Inviter par SMS', copy_link: 'Copier le lien', invite_message: 'Invitation Appletics',
    manual_entry: 'Ajouter manuellement', or_invite: 'ou envoyer une invitation', athlete_added: 'Athlète ajouté !', send_invite: "Envoyer l'invitation",
    delete_athlete: "Supprimer l'athlète", delete_athlete_confirm: "Cela supprimera définitivement cet athlète. Continuer ?", athlete_deleted: 'Athlète supprimé',
    coach_name: 'Nom complet', coach_club: 'Club', coach_role: 'Rôle', coach_email: 'Email', profile_saved: 'Profil enregistré !',
    fetch_results: 'Récupérer les résultats', fetching: 'Recherche en cours...', no_results_found: 'Aucun résultat trouvé', import_all: 'Tout importer',
    results_found: 'résultats trouvés', imported: 'Importé', import: 'Importer',
    settings: 'Paramètres', language: 'Langue', select_language: 'Choisir la langue', appearance: 'Apparence', notifications: 'Notifications',
    sprints: 'Sprint', distance: 'Demi-fond', field: 'Sauts/Lancers', hurdles: 'Haies', relay: 'Relais', jumps: 'Sauts', throws: 'Lancers',
    enter_name: 'Nom complet', enter_events: 'ex. 100m, 200m', events_hint: 'Séparez les épreuves par des virgules',
    status_label: 'Statut', pb_label: 'Records personnels', add_pb: 'Ajouter un record', event_label: 'Épreuve', performance_label: 'Performance',
    plan_description_duration: 'Durée (min)', phase_intensity: 'Intensité',
    group_all: 'Tous', group_sprints: 'Sprint', group_distance: 'Demi-fond', group_hurdles: 'Haies',
    group_jumps: 'Sauts', group_throws: 'Lancers', group_relay: 'Relais',
    intensity_easy: 'Facile', intensity_moderate: 'Modéré', intensity_hard: 'Difficile', intensity_race: 'Allure course', intensity_rest: 'Repos',
    day_mon: 'Lun', day_tue: 'Mar', day_wed: 'Mer', day_thu: 'Jeu', day_fri: 'Ven', day_sat: 'Sam', day_sun: 'Dim',
  },
  de: {
    nav_home: 'Startseite', nav_plans: 'Pläne', nav_meets: 'Wettkämpfe', nav_chat: 'Chat', nav_profile: 'Profil',
    add: 'Hinzufügen', cancel: 'Abbrechen', save: 'Speichern', delete: 'Löschen', edit: 'Bearbeiten', close: 'Schließen', back: 'Zurück',
    search: 'Suchen', loading: 'Laden...', error: 'Fehler', success: 'Erfolg', all: 'Alle', none: 'Keine', see_all: 'Alle anzeigen',
    send: 'Senden', optional: 'Optional', required: 'Erforderlich', select: 'Auswählen', confirm: 'Bestätigen', invite: 'Einladen',
    good_morning: 'Guten Morgen,', todays_training: 'Heute', upcoming_meets: 'Bevorstehende Wettkämpfe', quick_actions: 'Schnellaktionen',
    rest_day: 'Ruhetag oder keine Einheiten geplant', no_meets: 'Keine bevorstehenden Wettkämpfe',
    new_plan: 'Neuer Plan', add_meet: 'Wettkampf hinzufügen', messages: 'Nachrichten', athletes: 'Athleten',
    training_plans: 'Trainingspläne', active_plans: 'aktive Pläne', add_plan: 'Plan hinzufügen', no_plans: 'Keine Pläne für diese Gruppe',
    phase: 'Phase', weeks: 'Wochen', sessions: 'Einheiten', plan_title: 'Plantitel', plan_description: 'Beschreibung',
    group: 'Gruppe', start_date: 'Startdatum', end_date: 'Enddatum', create_plan: 'Plan erstellen', plan_detail: 'Plandetails',
    competitions: 'Wettkämpfe', upcoming: 'Bevorstehend', completed: 'Abgeschlossen', cancelled: 'Abgesagt', results: 'Ergebnisse',
    event_wins: 'Siege', pbs_set: 'PBs', meets_done: 'Abgeschlossen', venue: 'Veranstaltungsort', location: 'Ort',
    team_score: 'Teampunkte', team_rank: 'Teamrang', no_meets_found: 'Keine Wettkämpfe', add_competition: 'Hinzufügen',
    live_results: 'Live-Ergebnisse', swiss_athletics_live: 'Swiss Athletics Bestenlisten',
    chat_messages: 'Nachrichten', all_caught_up: 'Alles gelesen', type_message: 'Nachricht eingeben...', no_channels: 'Keine Kanäle',
    staff: 'Team', groups: 'Gruppen', admin: 'Admin',
    total: 'Gesamt', coaches: 'Trainer', profile_photo: 'Profilfoto', photo_choose: 'Foto hinzufügen', photo_change: 'Foto ändern', photo_remove: 'Foto entfernen', photo_permission: 'Erlauben Sie den Fotozugriff in den Geräteeinstellungen.', photo_error: 'Das Foto konnte nicht gespeichert werden. Wählen Sie ein anderes Bild.',
    profile: 'Profil', all_athletes: 'Alle Athleten', add_athlete: 'Athleten hinzufügen', invite_athlete: 'Athleten einladen', edit_profile: 'Profil bearbeiten',
    athlete_name: 'Athletenname', athlete_events: 'Disziplinen', athlete_group: 'Gruppe', athlete_status: 'Status',
    active: 'Aktiv', injured: 'Verletzt', inactive: 'Inaktiv', squad_by_group: 'Kader nach Gruppe',
    personal_bests: 'Persönliche Bestleistungen', training_plans_cap: 'Trainingspläne', recent_results: 'Aktuelle Ergebnisse',
    wins: 'Siege', pbs: 'PBs', no_results: 'Keine Ergebnisse', no_plans_assigned: 'Kein Plan zugewiesen',
    invite_via_email: 'Per E-Mail einladen', invite_via_sms: 'Per SMS einladen', copy_link: 'Link kopieren', invite_message: 'Appletics-Einladung',
    manual_entry: 'Manuell hinzufügen', or_invite: 'oder Einladung senden', athlete_added: 'Athlet hinzugefügt!', send_invite: 'Einladung senden',
    delete_athlete: 'Athleten löschen', delete_athlete_confirm: 'Dieser Athlet wird endgültig gelöscht. Fortfahren?', athlete_deleted: 'Athlet gelöscht',
    coach_name: 'Vollständiger Name', coach_club: 'Verein', coach_role: 'Funktion', coach_email: 'E-Mail', profile_saved: 'Profil gespeichert!',
    fetch_results: 'Ergebnisse abrufen', fetching: 'Suche läuft...', no_results_found: 'Keine Ergebnisse gefunden', import_all: 'Alle importieren',
    results_found: 'Ergebnisse gefunden', imported: 'Importiert', import: 'Importieren',
    settings: 'Einstellungen', language: 'Sprache', select_language: 'Sprache wählen', appearance: 'Erscheinungsbild', notifications: 'Benachrichtigungen',
    sprints: 'Sprint', distance: 'Mittelstrecke', field: 'Sprung/Wurf', hurdles: 'Hürden', relay: 'Staffel', jumps: 'Sprung', throws: 'Wurf',
    enter_name: 'Vollständiger Name', enter_events: 'z.B. 100m, 200m', events_hint: 'Disziplinen mit Komma trennen',
    status_label: 'Status', pb_label: 'Persönliche Bestleistungen', add_pb: 'PB hinzufügen', event_label: 'Disziplin', performance_label: 'Leistung',
    plan_description_duration: 'Dauer (min)', phase_intensity: 'Intensität',
    group_all: 'Alle', group_sprints: 'Sprint', group_distance: 'Mittelstrecke', group_hurdles: 'Hürden',
    group_jumps: 'Sprung', group_throws: 'Wurf', group_relay: 'Staffel',
    intensity_easy: 'Leicht', intensity_moderate: 'Mittel', intensity_hard: 'Hart', intensity_race: 'Wettkampftempo', intensity_rest: 'Ruhe',
    day_mon: 'Mo', day_tue: 'Di', day_wed: 'Mi', day_thu: 'Do', day_fri: 'Fr', day_sat: 'Sa', day_sun: 'So',
  },
  it: {
    nav_home: 'Home', nav_plans: 'Piani', nav_meets: 'Gare', nav_chat: 'Chat', nav_profile: 'Profilo',
    add: 'Aggiungi', cancel: 'Annulla', save: 'Salva', delete: 'Elimina', edit: 'Modifica', close: 'Chiudi', back: 'Indietro',
    search: 'Cerca', loading: 'Caricamento...', error: 'Errore', success: 'Successo', all: 'Tutti', none: 'Nessuno', see_all: 'Vedi tutti',
    send: 'Invia', optional: 'Opzionale', required: 'Obbligatorio', select: 'Seleziona', confirm: 'Conferma', invite: 'Invita',
    good_morning: 'Buongiorno,', todays_training: 'Oggi', upcoming_meets: 'Prossime gare', quick_actions: 'Azioni rapide',
    rest_day: 'Giorno di riposo o nessuna sessione pianificata', no_meets: 'Nessuna gara imminente',
    new_plan: 'Nuovo piano', add_meet: 'Aggiungi gara', messages: 'Messaggi', athletes: 'Atleti',
    training_plans: 'Piani di allenamento', active_plans: 'piani attivi', add_plan: 'Aggiungi piano', no_plans: 'Nessun piano per questo gruppo',
    phase: 'Fase', weeks: 'settimane', sessions: 'sessioni', plan_title: 'Titolo piano', plan_description: 'Descrizione',
    group: 'Gruppo', start_date: 'Data inizio', end_date: 'Data fine', create_plan: 'Crea piano', plan_detail: 'Dettaglio piano',
    competitions: 'Competizioni', upcoming: 'In programma', completed: 'Conclusa', cancelled: 'Annullata', results: 'Risultati',
    event_wins: 'Vittorie', pbs_set: 'Record pers.', meets_done: 'Concluse', venue: 'Impianto', location: 'Luogo',
    team_score: 'Punteggio squadra', team_rank: 'Classifica', no_meets_found: 'Nessuna gara', add_competition: 'Aggiungi',
    live_results: 'Risultati live', swiss_athletics_live: 'Swiss Athletics — liste dei migliori',
    chat_messages: 'Messaggi', all_caught_up: 'Tutto letto', type_message: 'Scrivi un messaggio...', no_channels: 'Nessun canale',
    staff: 'Staff', groups: 'Gruppi', admin: 'Admin',
    total: 'Totale', coaches: 'Allenatori', profile_photo: 'Foto profilo', photo_choose: 'Aggiungi foto', photo_change: 'Cambia foto', photo_remove: 'Rimuovi foto', photo_permission: 'Consenti l’accesso alle foto nelle impostazioni del dispositivo.', photo_error: 'Impossibile salvare la foto. Scegli un’altra immagine.',
    profile: 'Profilo', all_athletes: 'Tutti gli atleti', add_athlete: 'Aggiungi atleta', invite_athlete: 'Invita atleta', edit_profile: 'Modifica profilo',
    athlete_name: 'Nome atleta', athlete_events: 'Discipline', athlete_group: 'Gruppo', athlete_status: 'Stato',
    active: 'Attivo', injured: 'Infortunato', inactive: 'Inattivo', squad_by_group: 'Squadra per gruppo',
    personal_bests: 'Record personali', training_plans_cap: 'Piani di allenamento', recent_results: 'Risultati recenti',
    wins: 'Vittorie', pbs: 'Record', no_results: 'Nessun risultato', no_plans_assigned: 'Nessun piano assegnato',
    invite_via_email: 'Invita per email', invite_via_sms: 'Invita per SMS', copy_link: 'Copia link', invite_message: 'Invito Appletics',
    manual_entry: 'Aggiungi manualmente', or_invite: 'o invia un invito', athlete_added: 'Atleta aggiunto!', send_invite: 'Invia invito',
    delete_athlete: 'Elimina atleta', delete_athlete_confirm: "Questo atleta verrà eliminato definitivamente. Continuare?", athlete_deleted: 'Atleta eliminato',
    coach_name: 'Nome completo', coach_club: 'Club', coach_role: 'Ruolo', coach_email: 'Email', profile_saved: 'Profilo salvato!',
    fetch_results: 'Cerca risultati', fetching: 'Ricerca in corso...', no_results_found: 'Nessun risultato', import_all: 'Importa tutti',
    results_found: 'risultati trovati', imported: 'Importato', import: 'Importa',
    settings: 'Impostazioni', language: 'Lingua', select_language: 'Seleziona lingua', appearance: 'Aspetto', notifications: 'Notifiche',
    sprints: 'Velocità', distance: 'Mezzofondo', field: 'Salti/Lanci', hurdles: 'Ostacoli', relay: 'Staffetta', jumps: 'Salti', throws: 'Lanci',
    enter_name: 'Nome completo', enter_events: 'es. 100m, 200m', events_hint: 'Separa le discipline con virgole',
    status_label: 'Stato', pb_label: 'Record personali', add_pb: 'Aggiungi record', event_label: 'Disciplina', performance_label: 'Prestazione',
    plan_description_duration: 'Durata (min)', phase_intensity: 'Intensità',
    group_all: 'Tutti', group_sprints: 'Velocità', group_distance: 'Mezzofondo', group_hurdles: 'Ostacoli',
    group_jumps: 'Salti', group_throws: 'Lanci', group_relay: 'Staffetta',
    intensity_easy: 'Facile', intensity_moderate: 'Moderata', intensity_hard: 'Intensa', intensity_race: 'Ritmo gara', intensity_rest: 'Riposo',
    day_mon: 'Lun', day_tue: 'Mar', day_wed: 'Mer', day_thu: 'Gio', day_fri: 'Ven', day_sat: 'Sab', day_sun: 'Dom',
  },
  es: {
    nav_home: 'Inicio', nav_plans: 'Planes', nav_meets: 'Competencias', nav_chat: 'Chat', nav_profile: 'Perfil',
    add: 'Agregar', cancel: 'Cancelar', save: 'Guardar', delete: 'Eliminar', edit: 'Editar', close: 'Cerrar', back: 'Atrás',
    search: 'Buscar', loading: 'Cargando...', error: 'Error', success: 'Éxito', all: 'Todos', none: 'Ninguno', see_all: 'Ver todo',
    send: 'Enviar', optional: 'Opcional', required: 'Requerido', select: 'Seleccionar', confirm: 'Confirmar', invite: 'Invitar',
    good_morning: 'Buenos días,', todays_training: 'Hoy', upcoming_meets: 'Próximas competencias', quick_actions: 'Acciones rápidas',
    rest_day: 'Día de descanso o sin sesiones', no_meets: 'Sin competencias próximas',
    new_plan: 'Nuevo plan', add_meet: 'Agregar competencia', messages: 'Mensajes', athletes: 'Atletas',
    training_plans: 'Planes de entrenamiento', active_plans: 'planes activos', add_plan: 'Agregar plan', no_plans: 'No hay planes para este grupo',
    phase: 'Fase', weeks: 'semanas', sessions: 'sesiones', plan_title: 'Título del plan', plan_description: 'Descripción',
    group: 'Grupo', start_date: 'Fecha inicio', end_date: 'Fecha fin', create_plan: 'Crear plan', plan_detail: 'Detalle del plan',
    competitions: 'Competencias', upcoming: 'Próximas', completed: 'Finalizada', cancelled: 'Cancelada', results: 'Resultados',
    event_wins: 'Victorias', pbs_set: 'Récords pers.', meets_done: 'Finalizadas', venue: 'Sede', location: 'Ubicación',
    team_score: 'Puntuación equipo', team_rank: 'Clasificación', no_meets_found: 'No hay competencias', add_competition: 'Agregar',
    live_results: 'Resultados en vivo', swiss_athletics_live: 'Swiss Athletics — listas de los mejores',
    chat_messages: 'Mensajes', all_caught_up: 'Todo leído', type_message: 'Escribe un mensaje...', no_channels: 'Sin canales',
    staff: 'Personal', groups: 'Grupos', admin: 'Admin',
    total: 'Total', coaches: 'Entrenadores', profile_photo: 'Foto de perfil', photo_choose: 'Añadir foto', photo_change: 'Cambiar foto', photo_remove: 'Quitar foto', photo_permission: 'Permite el acceso a las fotos en los ajustes del dispositivo.', photo_error: 'No se pudo guardar la foto. Elige otra imagen.',
    profile: 'Perfil', all_athletes: 'Todos los atletas', add_athlete: 'Agregar atleta', invite_athlete: 'Invitar atleta', edit_profile: 'Editar perfil',
    athlete_name: 'Nombre del atleta', athlete_events: 'Eventos', athlete_group: 'Grupo', athlete_status: 'Estado',
    active: 'Activo', injured: 'Lesionado', inactive: 'Inactivo', squad_by_group: 'Equipo por grupo',
    personal_bests: 'Marcas personales', training_plans_cap: 'Planes de entrenamiento', recent_results: 'Resultados recientes',
    wins: 'Victorias', pbs: 'Récords', no_results: 'Sin resultados', no_plans_assigned: 'Sin plan asignado',
    invite_via_email: 'Invitar por correo', invite_via_sms: 'Invitar por SMS', copy_link: 'Copiar enlace', invite_message: 'Invitación Appletics',
    manual_entry: 'Agregar manualmente', or_invite: 'o enviar una invitación', athlete_added: 'Atleta agregado!', send_invite: 'Enviar invitación',
    delete_athlete: 'Eliminar atleta', delete_athlete_confirm: 'Este atleta será eliminado permanentemente. ¿Continuar?', athlete_deleted: 'Atleta eliminado',
    coach_name: 'Nombre completo', coach_club: 'Club', coach_role: 'Rol', coach_email: 'Correo', profile_saved: 'Perfil guardado!',
    fetch_results: 'Buscar resultados', fetching: 'Buscando...', no_results_found: 'Sin resultados', import_all: 'Importar todo',
    results_found: 'resultados encontrados', imported: 'Importado', import: 'Importar',
    settings: 'Ajustes', language: 'Idioma', select_language: 'Seleccionar idioma', appearance: 'Apariencia', notifications: 'Notificaciones',
    sprints: 'Velocidad', distance: 'Medio fondo', field: 'Saltos/Lanzamientos', hurdles: 'Vallas', relay: 'Relevos', jumps: 'Saltos', throws: 'Lanzamientos',
    enter_name: 'Nombre completo', enter_events: 'ej. 100m, 200m', events_hint: 'Separa los eventos con comas',
    status_label: 'Estado', pb_label: 'Marcas personales', add_pb: 'Agregar marca', event_label: 'Evento', performance_label: 'Rendimiento',
    plan_description_duration: 'Duración (min)', phase_intensity: 'Intensidad',
    group_all: 'Todos', group_sprints: 'Velocidad', group_distance: 'Medio fondo', group_hurdles: 'Vallas',
    group_jumps: 'Saltos', group_throws: 'Lanzamientos', group_relay: 'Relevos',
    intensity_easy: 'Suave', intensity_moderate: 'Moderada', intensity_hard: 'Intensa', intensity_race: 'Ritmo carrera', intensity_rest: 'Descanso',
    day_mon: 'Lun', day_tue: 'Mar', day_wed: 'Mié', day_thu: 'Jue', day_fri: 'Vie', day_sat: 'Sáb', day_sun: 'Dom',
  },
  pt: {
    nav_home: 'Início', nav_plans: 'Planos', nav_meets: 'Competições', nav_chat: 'Chat', nav_profile: 'Perfil',
    add: 'Adicionar', cancel: 'Cancelar', save: 'Salvar', delete: 'Excluir', edit: 'Editar', close: 'Fechar', back: 'Voltar',
    search: 'Pesquisar', loading: 'Carregando...', error: 'Erro', success: 'Sucesso', all: 'Todos', none: 'Nenhum', see_all: 'Ver tudo',
    send: 'Enviar', optional: 'Opcional', required: 'Obrigatório', select: 'Selecionar', confirm: 'Confirmar', invite: 'Convidar',
    good_morning: 'Bom dia,', todays_training: 'Hoje', upcoming_meets: 'Próximas competições', quick_actions: 'Ações rápidas',
    rest_day: 'Dia de descanso ou sem sessões', no_meets: 'Sem competições próximas',
    new_plan: 'Novo plano', add_meet: 'Adicionar competição', messages: 'Mensagens', athletes: 'Atletas',
    training_plans: 'Planos de treino', active_plans: 'planos ativos', add_plan: 'Adicionar plano', no_plans: 'Sem planos para este grupo',
    phase: 'Fase', weeks: 'semanas', sessions: 'sessões', plan_title: 'Título do plano', plan_description: 'Descrição',
    group: 'Grupo', start_date: 'Data início', end_date: 'Data fim', create_plan: 'Criar plano', plan_detail: 'Detalhe do plano',
    competitions: 'Competições', upcoming: 'Próximas', completed: 'Concluída', cancelled: 'Cancelada', results: 'Resultados',
    event_wins: 'Vitórias', pbs_set: 'Recordes pess.', meets_done: 'Concluídas', venue: 'Local', location: 'Localização',
    team_score: 'Pontuação equipa', team_rank: 'Classificação', no_meets_found: 'Sem competições', add_competition: 'Adicionar',
    live_results: 'Resultados ao vivo', swiss_athletics_live: 'Swiss Athletics — listas dos melhores',
    chat_messages: 'Mensagens', all_caught_up: 'Tudo lido', type_message: 'Escreve uma mensagem...', no_channels: 'Sem canais',
    staff: 'Pessoal', groups: 'Grupos', admin: 'Admin',
    total: 'Total', coaches: 'Treinadores', profile_photo: 'Foto de perfil', photo_choose: 'Adicionar foto', photo_change: 'Alterar foto', photo_remove: 'Remover foto', photo_permission: 'Permita o acesso às fotos nas definições do dispositivo.', photo_error: 'Não foi possível guardar a foto. Escolha outra imagem.',
    profile: 'Perfil', all_athletes: 'Todos os atletas', add_athlete: 'Adicionar atleta', invite_athlete: 'Convidar atleta', edit_profile: 'Editar perfil',
    athlete_name: 'Nome do atleta', athlete_events: 'Eventos', athlete_group: 'Grupo', athlete_status: 'Estado',
    active: 'Ativo', injured: 'Lesionado', inactive: 'Inativo', squad_by_group: 'Equipa por grupo',
    personal_bests: 'Recordes pessoais', training_plans_cap: 'Planos de treino', recent_results: 'Resultados recentes',
    wins: 'Vitórias', pbs: 'Recordes', no_results: 'Sem resultados', no_plans_assigned: 'Sem plano atribuído',
    invite_via_email: 'Convidar por email', invite_via_sms: 'Convidar por SMS', copy_link: 'Copiar link', invite_message: 'Convite Appletics',
    manual_entry: 'Adicionar manualmente', or_invite: 'ou enviar convite', athlete_added: 'Atleta adicionado!', send_invite: 'Enviar convite',
    delete_athlete: 'Eliminar atleta', delete_athlete_confirm: 'Este atleta será permanentemente eliminado. Continuar?', athlete_deleted: 'Atleta eliminado',
    coach_name: 'Nome completo', coach_club: 'Clube', coach_role: 'Função', coach_email: 'Email', profile_saved: 'Perfil guardado!',
    fetch_results: 'Buscar resultados', fetching: 'A pesquisar...', no_results_found: 'Sem resultados', import_all: 'Importar tudo',
    results_found: 'resultados encontrados', imported: 'Importado', import: 'Importar',
    settings: 'Definições', language: 'Idioma', select_language: 'Selecionar idioma', appearance: 'Aparência', notifications: 'Notificações',
    sprints: 'Velocidade', distance: 'Meio-fundo', field: 'Saltos/Lançamentos', hurdles: 'Barreiras', relay: 'Estafetas', jumps: 'Saltos', throws: 'Lançamentos',
    enter_name: 'Nome completo', enter_events: 'ex. 100m, 200m', events_hint: 'Separa os eventos com vírgulas',
    status_label: 'Estado', pb_label: 'Recordes pessoais', add_pb: 'Adicionar recorde', event_label: 'Evento', performance_label: 'Desempenho',
    plan_description_duration: 'Duração (min)', phase_intensity: 'Intensidade',
    group_all: 'Todos', group_sprints: 'Velocidade', group_distance: 'Meio-fundo', group_hurdles: 'Barreiras',
    group_jumps: 'Saltos', group_throws: 'Lançamentos', group_relay: 'Estafetas',
    intensity_easy: 'Fácil', intensity_moderate: 'Moderada', intensity_hard: 'Intensa', intensity_race: 'Ritmo corrida', intensity_rest: 'Descanso',
    day_mon: 'Seg', day_tue: 'Ter', day_wed: 'Qua', day_thu: 'Qui', day_fri: 'Sex', day_sat: 'Sáb', day_sun: 'Dom',
  },
};
export const translations: Translations = {
  fr: bundledTranslations.fr,
  de: bundledTranslations.de,
  it: bundledTranslations.it,
};
