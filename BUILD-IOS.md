# Appletics — construire la version iPhone (TestFlight / App Store)

Ce code est la version corrigée de l'export OnSpace ; il ne dépend plus d'OnSpace (voir `QUITTER-ONSPACE.md`). Il sert pour l'app iPhone **et** pour la web app.

## Ce qui a été corrigé

1. **Boucle infinie au démarrage** (`app/index.tsx`) : pour tout utilisateur non connecté ou nouveau,
   l'écran d'accueil envoyait vers `/login` pendant que le gardien de navigation (`app/_layout.tsx`)
   renvoyait vers `/onboarding`, sans fin (« Maximum update depth exceeded »). Seul le gardien décide
   désormais de la navigation. C'est la cause la plus probable de l'app bloquée sur le logo.
2. **Versions des dépendances alignées sur Expo SDK 53** : `expo-router ~5.1.0`, `expo-image ~2.3.0`,
   `expo-web-browser ~14.2.0`, `react-native 0.79.4`. Suppression de `expo-modules-autolinking: "*"`,
   qui pouvait installer une version incompatible au moment du build.
3. **Configuration du build** : `eas.json` contient l'identifiant iOS `app.onspace.appletics` et
   `app.json` la version `1.0.1`. Le contournement d'OnSpace pour le plantage natif
   (`newArchEnabled: false` dans `app.config.ts`) est conservé.
4. **Web app** : `app/+html.tsx` et `public/` (manifest, icônes, service worker). Sans effet sur iPhone.

Vérifié ici : le bundle JavaScript iOS se compile (1 653 modules, sans erreur) et la version web
démarre jusqu'au formulaire du profil coach. **Non vérifié** : compilation native, signature et test
sur iPhone. Ces étapes se font avec ton compte, ci-dessous.

## Construire la build iPhone (sans Mac)

Le build se fait dans le cloud d'Expo (EAS). Il te faut un ordinateur (Mac ou PC) avec Node.js 20 ou plus,
ton compte Apple Developer, et un compte gratuit sur expo.dev.

```sh
# 1. Dans le dossier du code
npm install
npm install -g eas-cli

# 2. Se connecter à Expo (créer un compte gratuit sur expo.dev si besoin)
eas login

# 3. Relier le projet à ton compte Expo
eas init
#    Si eas init demande d'ajouter "extra.eas.projectId", ajoute l'ID affiché dans app.json :
#    "extra": { "distribution": "testflight", "eas": { "projectId": "<ID>" } }

# 4. Numéro de build : il doit dépasser celui d'OnSpace (1793363510)
eas build:version:set --platform ios
#    -> saisir 1793363511

# 5. Lancer le build iOS (connexion Apple demandée ; EAS gère les certificats)
eas build --platform ios --profile testflight

# 6. Envoyer la build dans App Store Connect / TestFlight
eas submit --platform ios --profile testflight --latest
```

Ensuite, dans App Store Connect, la build apparaît dans TestFlight après 10 à 30 minutes de traitement.

## Tester avant d'ouvrir l'accès

- 5 démarrages à froid (fermer complètement l'app entre chaque).
- Créer un compte coach, se déconnecter, se reconnecter.
- Ajouter un athlète, un plan, une compétition ; fermer et rouvrir l'app.
- Mettre l'app en arrière-plan puis la rouvrir.
- Ne pas désinstaller l'app existante : installer la mise à jour par-dessus.

## Avant une sortie publique sur l'App Store (pas pour TestFlight)

- **Abonnement « Pro »** : il passe par Stripe. C'est la clé Stripe du serveur qui décide du mode : `sk_test_` pour les essais, `sk_live_` pour les vrais paiements. Apple exige ses achats intégrés
  (StoreKit) pour débloquer des fonctions numériques dans une app iPhone. Le profil `testflight`
  désactive déjà Stripe sur iOS. Pour l'App Store : soit intégrer les achats Apple
  (par exemple avec RevenueCat), soit ne proposer aucun achat dans l'app iPhone et vendre
  l'abonnement uniquement via la web app.
- **Chat** : chaque groupe partagé a une discussion en ligne, avec signalement et blocage, comme Apple l'exige. Les autres conversations restent sur l'appareil.
- Voir aussi `docs/app-store-readiness.md`.

## Fichier `.env`

Il contient l'adresse du serveur et la clé publique (`EXPO_PUBLIC_…`), nécessaires au build.
Cette clé est prévue pour être publique dans l'app, mais ne publie pas le dépôt en accès public.
