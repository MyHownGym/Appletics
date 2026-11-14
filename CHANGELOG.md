# Journal des versions — Appletics

Numérotation : MAJEUR.MINEUR.CORRECTIF
- MINEUR (1.x.0) : nouvelles fonctions
- CORRECTIF (1.1.x) : corrections et retouches visuelles

## 1.4.0 — 14 novembre 2026
- Coachs d'un club : ils profitent de la formule du club (Club Basic → Pro, Club Pro et Club Elite → Elite), sans payer
- Bouton « Quitter le club » : le coach repasse en Basic (sans nouvel essai) et peut prendre Pro ou Elite
- SQL n° 18 (coachs-club) à exécuter dans Supabase

## 1.3.0 — 14 novembre 2026
- Club : inviter un coach envoie un vrai e-mail ; le coach rejoint le groupe « <club> · Coachs » après avoir créé son compte
- Profil club : bouton « Ajouter un coach »

## 1.2.1 — 14 novembre 2026
- Liens externes (Swiss Athletics, etc.) : ouverts directement dans le navigateur, dans un nouvel onglet

## 1.2.0 — 14 novembre 2026
- Changement de formule : choix entre « À la fin de mon abonnement » et « Tout de suite » (prorata Stripe)
- Club : une formule coach sur un compte club compte comme son équivalent club (plus de quota à 0 coach)

## 1.1.2 — 14 novembre 2026
- Enregistrer en PDF fonctionne depuis l'app installée sur iPhone (vrai fichier PDF, partage ou téléchargement)
- Compétitions : bandeau des chiffres en dégradé orange, liens « Résultats » et « Inscriptions » en entier
- Accueil sur iPhone : tout l'écran répond au défilement, jusqu'en bas
- La carte d'essai gratuit n'apparaît plus une fraction de seconde pour un compte abonné
- Mode test Stripe : carte de test affichée avec bouton Copier sur la page des formules

## 1.1.1 — 11 novembre 2026
- Fenêtres sur ordinateur : largeur limitée et centrées (ex. « Changer de profil »)
- Site : mentions légales et FAQ précisent les hébergeurs (données à Zurich, Cloudflare, Stripe, Hostpoint)

## 1.1.0 — 11 novembre 2026
- Essai gratuit de 30 jours avec compte à rebours et rappels (e-mail + notification)
- Messages privés (1:1)
- Prise en main au premier lancement selon le type de compte (coach, club, athlète), à revoir dans Réglages
- Plans terminés : onglet dédié et cartes estompées
- Nouvelles disciplines (3000m steeple, cross, semi-marathon, 20 km, marathon) et discipline personnalisée
- Menu latéral et barre mobile en dégradé orange, sélecteur de langue FR/DE/IT
- Profil coach / club / athlète aux couleurs du rôle
- Corrigé : la prise en main pouvait s'afficher plusieurs fois de suite
- Corrigé : « Derniers entraînements » affiche la vraie date (Hier, Aujourd'hui…)

## 1.0.1
- Version initiale publiée
