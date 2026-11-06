# Appletics — préparation TestFlight

## État de cette livraison

Bêta préparée dans le code, **pas encore compilée, signée, téléversée ou validée sur appareil**. TestFlight n’est pas une publication commerciale App Store. Les tests internes et externes sont deux étapes différentes ; les tests externes nécessitent une revue bêta Apple.

### Changements prêts

- Nom Appletics, version 1.0.0, numéro de build de départ 1, schémas `onspaceapp` et `appletics`, prise en charge iPhone/iPad et autorisations caméra/photothèque/Face ID.
- `eas.json` : profil `testflight`, distribution store, version des builds gérée à distance et auto-incrémentée, profil de soumission.
- `app.config.ts` : garde sur l’identifiant iOS définitif, conservation des réglages existants, exclusion du plugin Stripe/Apple Pay dans cette bêta. Pas d’identifiant, compte Apple, clé de signature ou lien TestFlight fictif.
- Achats Stripe et gestion externe désactivés sur iOS, y compris appels directs aux services. Aucun accès premium fictif et aucun encaissement réel. StoreKit n’est pas implémenté.
- Consignes de test FR/DE/IT depuis Réglages et explications visibles pour le chat et l’annuaire club locaux.
- Suppression sécurisée : mot de passe vérifié côté serveur, clôture du client Stripe test, suppression des données privées et des groupes détenus, suppression irréversible de la connexion, nettoyage de l’espace local et des rappels de cette installation.
- Protection RLS contre les JWT encore valides d’un compte supprimé. Les nouvelles fonctions d’effacement sont uniquement exécutables par le rôle serveur.
- Corrections de types du chat et des réglages, nettoyage des timers, notifications locales explicitement nommées et lien vers la bonne route de discussion.

## Données conservées après suppression

Dans les groupes détenus par d’autres membres, les contributions nécessaires à leur historique sportif peuvent garder un UUID technique d’auteur. Nom, e-mail, profil et notes associées au compte supprimé sont effacés ; les groupes détenus par le compte supprimé disparaissent pour tous leurs membres. Supabase Auth utilise ici une suppression irréversible avec identification technique hachée pour conserver l’intégrité des références partagées. Ce n’est pas une simple désactivation récupérable.

Les exports, copies détenues sur d’autres appareils et données historiques locales non attribuables à un compte ne sont pas effacés à distance. Le traitement de contrats Stripe live/anciens n’est pas implémenté dans cette bêta. Ne pas en créer dans son environnement.

## Informations que le propriétaire doit fournir

1. Compte Apple Developer actif et accès App Store Connect. Les mots de passe Apple et clés privées ne doivent pas être transmis dans le chat.
2. Identifiant iOS définitif déjà enregistré pour Appletics (Bundle ID) et numéro numérique de la fiche App Store Connect (Apple ID). Aucun ne peut être déduit du nom du site.
3. Dans l’environnement EAS `preview`, variable non secrète `APPLETICS_IOS_BUNDLE_IDENTIFIER` = le Bundle ID exact. À défaut, renseigner `ios.bundleIdentifier` dans `app.json` après confirmation de sa valeur. Le profil refuse volontairement de fabriquer un ID.
4. Rattacher le projet à votre compte Expo/EAS lors de la première configuration et laisser EAS gérer les certificats/profils de signature, ou utiliser la procédure Publish d’OnSpace avec les mêmes informations. Un fichier `eas.json` seul ne rattache pas le projet à un compte Apple.
5. Vérifier l’URL et le texte de la politique de confidentialité. La récupération automatique de `https://www.appletics.ch/politique-de-confidentialite` n’a pas fourni de politique lisible et affichait une adresse de contact différente (`contact@appletics.app`). Cela doit être contrôlé et corrigé sur le site dans son workspace Web ; ce projet mobile ne modifie pas ce site.

## Compilation et envoi depuis une exportation

Après configuration des comptes/variables publiques du backend via le client existant — ne pas inventer ou remplacer ses clés :

```sh
npx tsc --noEmit
npx expo-doctor
npx expo export --platform ios
npx eas-cli build --platform ios --profile testflight
npx eas-cli submit --platform ios --profile testflight --latest
```

Lors de la soumission, choisir la fiche App Store Connect correspondante ; EAS peut demander son Apple ID numérique. Ne jamais choisir un autre Bundle ID pour contourner une erreur. Ces commandes **n’ont pas été exécutées dans cette session**.

Le profil retirant Stripe/Apple Pay, aucun certificat marchand Apple Pay n’est requis pour cette bêta. Les autorisations Face ID, caméra et notifications locales restent nécessaires. La déclaration `ITSAppUsesNonExemptEncryption = false` correspond à l’usage TLS/HTTPS et aux API système de ce projet ; le propriétaire doit confirmer son exactitude lors de la déclaration d’export et la revoir si des fonctions cryptographiques non exemptées sont ajoutées.

## Crash au démarrage du build 1793363503

Le rapport Appletics du 30 octobre 2026 est analysé dans [Diagnostic du démarrage TestFlight](./testflight-startup-crash.md). Un contournement de configuration iOS est préparé pour Expo 52–54 uniquement. Il nécessite une nouvelle compilation native et une validation sur iPhone ; aucun correctif sur appareil n’est encore confirmé. Expo 55+ ne permet pas ce contournement et nécessite une investigation/mise à jour du runtime natif par le responsable de la compilation.

## Avant d’inviter des testeurs

- Déployer/vérifier `appletics-delete-account`, `appletics-billing` et le retour hébergé, et conserver les secrets uniquement côté serveur. Les définitions SQL de suppression/RLS ont été installées sans supprimer de compte pendant cette session.
- Installer le build via TestFlight sur un véritable iPhone, et tester également l’iPad si l’app est distribuée sur iPad.
- Réaliser toute la matrice ci-dessous, noter version/appareil/résultat. Ne pas cocher un test seulement parce qu’un fichier de test existe.
- Renseigner description bêta, « Quoi tester », contact de retour, confidentialité et réponses d’export dans App Store Connect.
- Commencer par un groupe interne. Pour un groupe externe ou lien public, ajouter les informations de revue et un compte de test accessible à Apple (créé via le vrai onboarding, sans mot de passe public de démonstration).
- Générer le véritable lien public TestFlight après autorisation Apple. Les invitations de l’app continuent à envoyer le site `https://www.appletics.ch/` tant que ce lien n’est pas fourni.

## Matrice de validation indispensable

- [ ] Démarrage à froid, redémarrage, mode avion, réseau retrouvé, portrait/paysage, petits iPhone et iPad : aucune page blanche.
- [ ] Inscription e-mail/OTP 4 chiffres, prénom obligatoire, code invalide/expiré, connexion, mauvais mot de passe, session expirée, changement de compte.
- [ ] Face ID accepté/refusé/annulé/non autorisé et secours par mot de passe/code de l’appareil.
- [ ] Photo via photothèque/fichiers/caméra ; refus d’autorisation ; clavier ne cachant aucune action.
- [ ] Création/édition/suppression locale des athlètes, plans, séances et compétitions ; PB et filtres de saisons ; quotas Basic et langues FR/DE/IT.
- [ ] Deux coachs et un athlète invités : séance publiée, performance enregistrée/éditée, affichage après polling, révocation et conflit de version ; compte étranger interdit.
- [ ] Discussions et club explicitement locaux ; aucun message annoncé comme envoyé à un autre téléphone.
- [ ] `/upgrade` iOS ne lance ni PaymentSheet, ni Checkout, ni portail, ni modification Stripe. Les groupes partagés restent accessibles sans achat.
- [ ] Suppression avec mauvais mot de passe, double clic, réseau interrompu : aucune fausse confirmation. Puis vrai compte de test : client Stripe test clôturé, profil absent, connexion impossible, aucune nouvelle écriture avec un ancien JWT.
- [ ] Suppression du coach propriétaire : groupes détenus supprimés. Suppression d’un membre : historique des autres conservé et identité effacée.
- [ ] Suppression sans client Stripe puis avec client Stripe test ; aucun profil, workspace, annuaire scoped ou rappel local de ce compte ne réapparaît.
- [ ] Liens légaux lisibles, contact cohérent, fiche de confidentialité exacte pour données locales/Cloud, aucun réel dossier de mineur dans les tests.

## Tests ajoutés

`deno test --allow-read supabase/functions/_shared/testflightIntegration_test.ts` vérifie uniquement des contrats de source (pas la signature, pas une suppression réelle, pas le bon fonctionnement de la caméra). Les tests précédents restent disponibles. Aucun de ces tests n’a été exécuté ici.

## Après la bêta, pas avant

La synchronisation du chat avec signalement/blocage, l’administration Cloud club/comité, la sauvegarde globale, l’intégration d’achats numériques autorisée et le traitement live des contrats restent des chantiers de publication commerciale. Leur présence n’est pas promise dans cette bêta limitée.

Références :
- https://developer.apple.com/testflight/
- https://developer.apple.com/app-store/review/guidelines/
- https://docs.expo.dev/build-reference/app-versions/
- https://supabase.com/docs/reference/javascript/auth-admin-deleteuser
