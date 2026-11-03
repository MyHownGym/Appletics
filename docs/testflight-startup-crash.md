# Appletics — diagnostic du crash au démarrage TestFlight

## Rapport analysé

- App : Appletics, `app.onspace.appletics`, version `1.0.0`, build `1793363503`.
- Incident : `E183DD47-4169-4ACE-8CA9-7D46E1F51888`, 30 octobre 2026 à 14:03:26 +0100.
- Appareil : iPhone14,7, iOS 26.7.2 (23H128).
- Signature : équipe `53UK5MA6ZS`, identique à celle fournie par le propriétaire. Le rapport ne montre pas un refus de signature.
- Crash environ une seconde après lancement : `EXC_BAD_ACCESS / SIGSEGV`, adresse `0x9`.
- Thread JavaScript : `hermes::vm::abstractEqualityTest_RJS`.
- En parallèle, `com.meta.react.turbomodulemanager.queue` accède à Hermes pour construire un `facebook::jsi::JSError` et sa pile.

## Interprétation et limites

Cette combinaison est compatible avec le problème connu de React Native où une exception d’un TurboModule est convertie en erreur JavaScript depuis le mauvais thread, provoquant une corruption du runtime Hermes. Elle ne désigne pas la méthode native initialement fautive. Les frames Appletics ne sont pas symboliquées : le module et l’exception initiale ne sont pas identifiés.

Ce rapport ne permet pas d’accuser Stripe, les notifications, Face ID, une ligne JavaScript précise ou les données locales. Ne pas changer les clés backend, désinstaller l’app, vider son stockage ou remplacer Hermes par un moteur arbitraire pour masquer le symptôme. Une ErrorBoundary React ne peut pas intercepter ce SIGSEGV natif.

## Contournement préparé dans le projet

`app.config.ts` lit la version réellement installée d’Expo pendant la résolution de configuration, puis ajoute `ios.newArchEnabled: false` **uniquement pour Expo 52, 53 et 54**. Ces SDK permettent encore l’ancienne architecture. Cela évite le chemin iOS bridgeless/TurboModule impliqué dans le rapport, mais peut seulement révéler l’exception native initiale au lieu de la résoudre.

- Android, le moteur JavaScript, les plugins, les schémas de retour, les autorisations, la signature et les données utilisateurs ne sont pas modifiés par ce contournement.
- Pour Expo 55+, aucun faux réglage de désactivation n’est ajouté : l’ancienne architecture n’existe plus. Le responsable du build doit vérifier les versions Expo/React Native et appliquer une version native compatible incluant les correctifs amont, puis identifier le module fautif.
- Le journal EAS d’une compilation iOS indique la version Expo et si le contournement est appliqué. Le fichier de configuration seul ne prouve pas que la chaîne de compilation OnSpace l’a pris en compte.

## Recompiler et vérifier

1. Dans OnSpace, relancer une **nouvelle compilation iOS**, puis la soumettre à TestFlight avec la même fiche et le même Bundle ID. Le numéro du build doit différer de `1793363503`.
2. Vérifier que la configuration effective de la compilation utilise `ios.newArchEnabled: false` si le SDK est 52–54. Une chaîne qui n’utilise que `app.json` doit être corrigée pour prendre en compte `app.config.ts`.
3. Installer la mise à jour depuis TestFlight **sans supprimer Appletics**, afin de conserver les données locales.
4. Tester au minimum cinq démarrages à froid, retour d’arrière-plan, réseau disponible/indisponible, onboarding, connexion et déverrouillage. Les modifications de configuration ne remplacent pas ces tests.
5. Si le crash persiste, partager le **nouveau** rapport `.ips` et les logs de compilation. Ne pas réutiliser le rapport de l’ancien build.

Depuis une exportation configurée, le propriétaire peut vérifier puis compiler :

```sh
npx expo config --type prebuild
npx expo-doctor
npx tsc --noEmit
npx expo export --platform ios
npx eas-cli build --platform ios --profile testflight --clear-cache
npx eas-cli submit --platform ios --profile testflight --latest
```

Aucune de ces commandes, aucune compilation native et aucun test iPhone n’ont été exécutés dans cette session. Un rafraîchissement du Live Preview ou une mise à jour JavaScript/OTA ne modifie pas l’architecture du build TestFlight déjà installé.

## Si une investigation native reste nécessaire

Pour le build original, fournir au responsable de compilation OnSpace (`contact@onspace.ai`) : le rapport complet, le build `1793363503`, les versions Expo/React Native effectivement compilées et les symboles dSYM correspondant à l’UUID Appletics `67a3d16a-95bc-3c95-91d9-47f854b014a5`. Il faut symboliquer notamment les offsets `6191968`, `6194088`, `6213236` du thread TurboModule. Les dSYM d’un nouveau build ne symboliquent pas l’ancien.

Le correctif amont de conversion d’exception évite un accès JSI sur le mauvais thread ; il ne dispense pas d’identifier l’exception native déclenchante. Ne pas patcher `node_modules`, Metro ou le code natif dans ce workspace pour improviser ce correctif.

## Mise à jour : écran de lancement puis « Loading... » sans crash

Les captures du 30 octobre à 14:45 et 14:46 montrent un logo de lancement puis un écran « Loading... ». Ce symptôme est distinct du SIGSEGV du rapport original. Le texte « Loading... » existe dans le chargeur par défaut d’`AuthRouter` ; la capture seule ne prouve pas quelle opération d’authentification ou quel build est bloqué. Les requêtes de facturation de 120 secondes observées dans Live Preview ne sont **pas** les logs de l’iPhone TestFlight.

Le projet dispose désormais d’un écran de démarrage React placé en dehors d’`AuthProvider`, et d’un chargeur explicite pour `AuthRouter`. Le splash natif est masqué après la mise en page de cet écran, sans attendre un profil Cloud ou Stripe. L’écran indique l’étape réelle : initialisation du fournisseur, session, réglages de l’appareil ou profil/historique. Après 15 secondes sans progression, il affiche une action **Réessayer** et une référence contenant la version, le build natif et l’étape, sans identifiants personnels ni jetons. L’attente d’un choix d’import de l’historique ne déclenche pas ce délai.

Les lectures des réglages et du profil sont bornées à 12 secondes. Les erreurs de restauration sont affichées sur cet écran, au lieu de laisser un chargement permanent derrière une alerte. Un profil inaccessible n’est pas traité comme un nouveau compte, et un historique vide n’est pas sauvegardé après une restauration échouée. Réessayer remonte les fournisseurs existants, conserve le client/session et ne supprime aucune donnée ; cela ne garantit pas de débloquer un verrou interne du client ou un problème de build natif.

Pour vérifier sur l’iPhone, relever d’abord le **numéro du build installé** dans TestFlight. Ces changements ne modifient pas rétroactivement ce build : ils doivent être inclus dans un nouveau binaire pour être testés. Après installation **sans supprimer Appletics**, partager une capture de la référence `startup:...` si la restauration échoue. Si le logo reste seul sans cet écran React dans le nouveau build, transmettre les journaux de lancement et les logs de compilation au support OnSpace pour vérifier le chargement du bundle JavaScript. Ne pas déduire que le problème natif est résolu à partir du Live Preview.

Aucune compilation iOS, exécution des tests ou vérification sur appareil n’a été effectuée pour cette mise à jour ; la cause exacte du blocage TestFlight reste à confirmer avec le build et l’étape affichés.

## Mise à jour : blocage à « Restauration de la session »

La capture de 15:14 confirme que le bundle React a démarré et que le fournisseur d’authentification n’a pas terminé son initialisation. Elle ne prouve pas la cause interne ni une panne Stripe. Les logs disponibles ici concernent le Live Preview, pas le téléphone ; le service Auth n’a renvoyé aucune erreur récente. La structure de `user_profiles` a été vérifiée par une requête SQL en lecture seule.

Un contournement ciblé est désormais installé **avant** le montage du fournisseur existant : `services/authStartupService.ts` adapte l’entrée publique `onAuthStateChange` du même client. Les notifications renvoient immédiatement au SDK, puis les traitements des abonnés sont exécutés au prochain tour de boucle, dans leur ordre de réception. Cela évite le verrou Supabase documenté lorsque des traitements asynchrones rappellent le client depuis un abonnement Auth. Un simple délai sur le chargeur ou un remontage du fournisseur ne corrige pas ce mécanisme.

- Le template, le stockage de la session, le fournisseur Auth, les mots de passe/OTP, les règles d’accès et le client unique sont conservés. Aucun accès n’est accordé pour contourner une attente et aucune déconnexion/effacement n’est déclenché.
- Les désabonnements annulent les notifications différées ; les erreurs d’abonnés ne bloquent pas les notifications suivantes. Les données de session ne sont jamais journalisées.
- La lecture de configuration Stripe attend désormais la fin de l’initialisation Auth ; elle ne conditionne toujours pas l’ouverture de l’application.
- La référence est visible immédiatement sur le chargeur, avec `auth-dispatch:1`, la version, le numéro de build et l’étape. Le bouton Réessayer reste disponible après 15 secondes sans progression.

Cette protection traite une cause connue, **pas une cause définitivement démontrée sur cet iPhone** : le code interne du template n’est pas accessible à l’éditeur et une restauration réseau/stockage peut aussi rester lente. Des tests comportementaux du dispatch avec un verrou simulé sont ajoutés dans `supabase/functions/_shared/authEventDispatch_test.ts`, ainsi que des contrats de montage. Ils n’ont pas été exécutés dans cette session ; aucune compilation ni validation iPhone n’a été effectuée.

Pour valider, intégrer ces changements dans un **nouveau build TestFlight**, installer la mise à jour sans supprimer Appletics, puis tester démarrage à froid, reconnexion, déconnexion et arrière-plan. Si le blocage demeure, attendre le message d’erreur et transmettre la capture contenant `auth-dispatch:1` et le build ; tester Réessayer sans vider les données. Ne pas refaire une compilation si le correctif est déjà présent avant d’examiner cette référence et les journaux de l’appareil.

## Références

- Verrou des callbacks Auth documenté par Supabase : https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0

- Analyse par l’équipe Hermes d’une signature similaire : https://github.com/facebook/hermes/issues/1957
- Correctif React Native : https://github.com/facebook/react-native/commit/a9a976af89c3cd52e7f742109e24dbc6ebf09aa9
- Limites du contournement selon Expo : https://docs.expo.dev/guides/new-architecture/
