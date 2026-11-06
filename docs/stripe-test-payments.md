# Appletics — paiements Stripe de test

## Périmètre de la bêta TestFlight

Les achats et la gestion externe Stripe sont désormais désactivés sur iOS, dans l’interface **et dans les services**. `/upgrade` présente les limites de la bêta plutôt qu’un paiement. Le profil EAS `testflight` retire le plugin Apple Pay/Stripe de la configuration native afin de ne pas demander de Merchant ID non configuré. Cela ne constitue pas une intégration StoreKit.

Les instructions Stripe natives ci-dessous restent une référence de développement pour Android et pour une éventuelle intégration iOS autorisée ultérieurement. Ne pas utiliser cette bêta pour valider Apple Pay ou des achats iOS. Le mode test serveur et les protections contre les clés live restent inchangés.

## Fenêtre intégrée comme sur la référence

Dans le flux de développement Stripe, hors bêta iOS TestFlight, sur un build Android intégrant `@stripe/stripe-react-native`, Profil > Abonnement > « Continuer » affiche d’abord un résumé compact, puis « Continuer vers le paiement » initialise et présente la véritable PaymentSheet Stripe. Il ne s’agit pas d’une imitation : Stripe gère Link, la saisie des cartes, les cartes enregistrées, l’authentification 3D Secure et le bouton affichant le montant CHF vérifié côté serveur.

- Le backend crée un abonnement `default_incomplete` à partir des 18 identifiants de prix CHF déjà enregistrés. La PaymentSheet confirme le PaymentIntent de la première facture (`latest_invoice.confirmation_secret`, API Basil).
- Une clé temporaire liée au client authentifié permet d’afficher les cartes enregistrées dans Stripe. Elles n’apparaissent pas artificiellement avant un premier paiement avec ce compte.
- Le mode test et le badge TEST sont gérés par Stripe. Link apparaît selon son activation et l’éligibilité du compte. L’apparence exacte dépend de la version du SDK et de la plateforme.
- Apple Pay / Google Pay sont configurés dans la PaymentSheet et proposés uniquement sur les builds et appareils éligibles.
- TWINT utilise le choix « TWINT / page Stripe » dans le résumé avant paiement. La fenêtre native est volontairement limitée aux cartes/Link et à leurs portefeuilles ; le mandat TWINT reste sur le Checkout hébergé existant.
- L’aperçu web ouvre Checkout Stripe. Il n’importe pas le module Stripe natif et n’affiche pas de faux formulaire de paiement.

## Sécurité des clés

- `STRIPE_SECRET_KEY` reste uniquement dans les secrets des Edge Functions. Les clés live sont bloquées avant toute opération Stripe.
- `STRIPE_PUBLISHABLE_KEY` est stockée dans les secrets serveur, jamais dans `.env` public ni dans le code. Elle doit commencer par `pk_test_` et appartenir au même compte/test que la clé secrète et les prix.
- **La clé publiable n’est pas une clé secrète. Le SDK doit la recevoir pour afficher PaymentSheet.** L’endpoint authentifié transmet uniquement cette clé publique et les autorisations temporaires nécessaires au paiement. Il ne transmet jamais la clé secrète Stripe, la clé service-role ou les secrets administratifs.
- L’action publique `config` retourne uniquement la disponibilité du catalogue et de la fenêtre native, pas les clés ni les autorisations temporaires.
- Les secrets PaymentIntent et clé éphémère sont utilisés uniquement en mémoire pendant l’appel et par le SDK. Aucun stockage local, aucune table avec ces secrets, aucun journal contenant les clés, les cartes ou les réponses sensibles. Réponses `Cache-Control: no-store`.
- Le UUID authentifié est associé au client Stripe par `billing_test_accounts`; aucune adoption de client à partir d’un e-mail fourni par le téléphone.
- Le prix, le montant, la devise, l’appartenance du client et le mode test sont validés côté serveur. Le pays marchand des portefeuilles provient du compte Stripe.

## Préparation et build

1. Dans OnSpace Cloud > Secrets, configurer `STRIPE_SECRET_KEY` de test et `STRIPE_PUBLISHABLE_KEY` de test du même compte où les prix Appletics sont créés.
2. Dans Stripe > Paramètres > Moyens de paiement, activer carte, Link, TWINT, Apple Pay et Google Pay souhaités dans le même environnement.
3. La bibliothèque native doit être compatible avec la version Expo (`npx expo install @stripe/stripe-react-native` lors d’une compilation locale/exportée). Le plugin Stripe est configuré dans `app.json`; générer un nouveau build après son ajout.
4. Apple Pay : enregistrer `merchant.com.appletics.payments` dans Apple Developer, configurer le certificat de traitement avec Stripe, activer la capacité Apple Pay pour le véritable identifiant d’app et vérifier le profil de signature du build. L’ajout du plugin ne réalise pas ces étapes dans les comptes externes.
5. Google Pay : le plugin active Google Pay et la PaymentSheet utilise `testEnv: true`. Tester un build Android installé sur un appareil compatible avec un portefeuille configuré.
6. Apple Pay et Google Pay ne sont pas disponibles dans Expo Go. Les aperçus OnSpace ne constituent pas une validation de ces portefeuilles; utiliser un build installé.
7. La PaymentSheet suit la langue système. Les localisations iOS fr/de/it/en sont déclarées; les textes Appletics restent traduits en français, allemand et italien.
8. Ouvrir Profil > Abonnement et choisir une formule. Le compte sécurisé n’est demandé qu’après « Continuer », dans le résumé. La session existante est réutilisée ; si elle est absente ou expirée, se connecter au compte existant sans le recréer. La création par code e-mail à 4 chiffres reste uniquement pour les nouveaux comptes. Le profil sportif local n’est pas un compte de facturation.

## Résumé et page allégée

- La page affiche la formule, la périodicité, le prix et trois capacités principales ; les fonctionnalités détaillées et l’aide technique sont repliées par défaut.
- Avant tout paiement natif ou Checkout, le résumé indique la formule, le montant CHF, la périodicité et le prochain renouvellement en français, allemand ou italien.
- Pour une nouvelle souscription, la date est explicitement estimée à partir du jour du paiement : +1 mois pour les mensualités (y compris engagement 12 mois), +12 mois pour l’annuel. Les fins de mois sont ajustées au dernier jour disponible. Stripe confirme ensuite l’échéance exacte ; aucune activation n’est déduite de cette estimation.
- Pour la reprise d’un essai incomplet de la même formule, l’échéance déjà retournée par Stripe est utilisée. Pour un changement, la date d’application utilise le maximum entre la fin de période payée et la fin d’engagement, comme le backend ; le renouvellement suivant reste estimé.
- L’acceptation du renouvellement et le choix paiement intégré/TWINT se font dans le résumé. L’interface de compte disparaît automatiquement après connexion, sans paiement automatique : une confirmation explicite reste nécessaire.
- Un compte authentifié reste obligatoire pour une souscription récurrente ; aucune connexion fictive, inscription automatique ou suppression de la vérification serveur.

## Vérification, abandon et reprise

- La réussite de la PaymentSheet ou un lien de retour ne donnent aucun droit à eux seuls. L’app relit Stripe avant d’activer la formule.
- Vérification après paiement, connexion, reprise de l’app, toutes les 60 secondes, puis toutes les 10 secondes pendant 3 minutes lorsqu’un paiement est en attente.
- Annuler la fenêtre demande au serveur d’abandonner uniquement la première facture native non payée. Un paiement déjà réussi ou en cours de traitement n’est pas annulé par cette action.
- Après une erreur ou une coupure réseau, le même essai incomplet peut être repris sans créer un deuxième abonnement. Un bouton permet d’abandonner explicitement l’essai natif avant de changer de formule ou d’utiliser TWINT.
- Une préparation de paiement est sérialisée par un bail serveur, commun à Checkout et PaymentSheet (`billing_test_payment_locks`). Les anciennes sessions Checkout encore ouvertes sont expirées avant la création native. Les RPC de bail sont accessibles uniquement au rôle serveur.
- Authentification changée : les réponses du compte précédent ne sont pas appliquées au nouveau compte. Le paiement est rechargé côté serveur après redémarrage.
- Résiliation mensuelle/annuelle à la fin de la période payée ; mensualités engagées à la fin des 12 mois. Réactivation avant échéance et changement programmé sans prorata immédiat restent disponibles.
- Le portail Stripe conserve factures et modification du moyen de paiement; les engagements et changements de formule restent gérés côté serveur par l’app.
- Pas de webhook; interrogation périodique de Stripe. Les sports et leurs quotas restent locaux, et les droits supérieurs nécessitent un abonnement confirmé.

## Tests carte

Utiliser une date future, CVC 123 et un code postal quelconque. Ne pas saisir de vraie carte dans le formulaire manuel de test.

| Scénario | Numéro |
| --- | --- |
| Succès | 4242 4242 4242 4242 |
| 3D Secure | 4000 0025 0000 3155 |
| Fonds insuffisants | 4000 0000 0000 9995 |

Pour les portefeuilles, ne pas ajouter de cartes 4242 à Apple Wallet/Google Pay. Suivre les procédures de test Stripe pour un portefeuille configuré; avec les clés test, les paiements ne débitent pas d’argent réel. Pour TWINT, Checkout simule l’autorisation/refus du mandat. En production, TWINT dépend de la validation du compte, du site public et des mentions légales.

## Correction des changements et résiliations (25 octobre 2026)

- Les journaux serveur confirmaient des `StripeInvalidRequestError` sur `change` et `cancel`. Les anciens journaux ne conservaient pas la raison Stripe précise ; ils ne permettent pas de déclarer un test de paiement réussi.
- La résiliation utilise désormais uniquement `cancel_at`, fixé au maximum de la période payée et de l’engagement. La réactivation efface le contrôle de résiliation présent sans envoyer deux contrôles contradictoires.
- Upgrade et downgrade restent **programmés à l’échéance ou à la fin de l’engagement**, sans débit supplémentaire immédiat. La phase active réelle du calendrier est conservée ; la phase suivante utilise une durée Stripe et un ancrage au début de phase.
- Une nouvelle opération n’utilise plus la clé idempotente d’un calendrier précédemment libéré. Les calendriers déjà actifs sont mis à jour ; un calendrier nouvellement créé dont la mise à jour échoue est libéré sans résilier l’abonnement payé.
- Paiement, changement, résiliation et réactivation partagent le verrou serveur. L’interrogation périodique ne peut plus remplacer une réponse de modification par une ancienne réponse.
- La nouvelle formule et sa date programmée sont visibles directement sur la page, sans ouvrir l’aide Stripe. Une demande identique déjà programmée n’est pas renvoyée.
- Les raisons Stripe sont maintenant journalisées et affichées après masquage des clés, secrets temporaires, e-mails et identifiants clients. Aucun secret ne quitte les Edge Functions.
- Régression pure : `deno test supabase/functions/_shared/billingManagement_test.ts`. Ces tests ne réalisent aucune opération Stripe. **Retester sur appareil** une hausse, une baisse, une résiliation, une réactivation, puis une nouvelle programmation après libération du calendrier.

## Retour après Checkout / portail (25 octobre 2026)

- L’ancienne fenêtre iOS utilisait `openBrowserAsync` : son bouton tentait de lancer `onspaceapp://billing-return` depuis Safari. Le navigateur ne pouvait pas résoudre ce lien dans l’environnement montré ; une page de retour n’est pas une preuve d’échec du paiement.
- Les nouveaux paiements hébergés et le portail utilisent `openAuthSessionAsync` sur iOS. Le bouton revient par `appletics://billing-return` à la session ouverte par l’app ; la résolution de la promesse déclenche la vérification Stripe, même sans événement Linking.
- Android utilise cette session seulement lorsque l’identifiant du package installé correspond à celui du projet. Dans les aperçus qui ne possèdent pas le schéma Appletics, la page explique comment fermer le navigateur plutôt que lancer un lien non reconnu.
- `app.json` conserve `onspaceapp` pour les flux existants et ajoute `appletics` pour le retour hébergé. **Un nouveau build est nécessaire pour enregistrer ce schéma dans une app installée.** Le callback de la PaymentSheet reste inchangé.
- Une ancienne page ou session Stripe sans indication de mode affiche désormais une aide de retour manuel : fermer avec la coche / Terminé en haut à gauche, ou revenir via le sélecteur d’apps, puis vérifier le paiement. Une page web ne peut pas fermer elle-même la fenêtre Safari d’une autre app.
- Les nouveaux Checkout ouverts sont réutilisés uniquement si leur URL de retour correspond au même environnement. Les anciennes préparations ouvertes sont expirées, pas les abonnements payés. Aucun second paiement n’est créé pour remplacer un abonnement déjà actif.
- Le retour est traduit en français, allemand et italien. La page publique ne lit ni session ni données utilisateur, ne confirme aucun droit, et n’accepte pas de destination native arbitraire.
- Ne pas relancer un paiement déjà effectué simplement parce que le retour a échoué : fermer la fenêtre et vérifier son statut avec le même compte.
- Tests ajoutés : `deno test --allow-read supabase/functions/_shared/billingReturn_test.ts`. Ils vérifient la navigation et les contrats de code sans contacter Stripe. **Ni ces tests ni les retours iOS/Android n’ont été exécutés dans cette session d’édition.** Tester une nouvelle session Checkout, annulation, portail, lien ancien, retour à chaud et après redémarrage sur build installé.

## Checklist sur appareil — non déclarée exécutée

- Première souscription dans chaque périodicité : montant correct en CHF, badge test, nouvelle carte et confirmation serveur.
- Retour au paiement avec le même compte : cartes enregistrées et Link selon l’activation, sans fausse carte préremplie.
- Carte refusée, authentification 3D Secure approuvée/abandonnée et fermeture de la fenêtre.
- Double pression et deux appareils : une seule préparation, pas deux abonnements.
- Coupure réseau avant/après confirmation, reprise du même essai et abandon explicite d’un essai non payé.
- TWINT : mandat accepté/refusé dans Checkout et retour vérifié côté serveur.
- Apple Pay et Google Pay : succès et abandon sur builds natifs séparés, portefeuille configuré, capacités externes en place.
- Redémarrage, compte différent et lien de succès fabriqué : aucun droit sans vérification Stripe du bon utilisateur.
- Résiliation/réactivation, échéances de l’engagement, changement de plan programmé et portail factures.
- Clé secrète ou publique live, clé manquante et clés de comptes différents : erreur visible, aucun accès premium non confirmé.

## Limites

L’intégration est destinée aux tests de développement. Aucun encaissement réel. Les opérations alimenteraient le solde Stripe puis les virements bancaires en production, après frais/délais, mais le passage live n’est pas activé. Le Merchant ID/certificat Apple, les tests sur builds installés, les règles App Store/Google Play pour abonnements numériques et les permissions partagées du comité restent à valider avant publication. Les simulations Test Clocks créées séparément ne sont pas associées au client de l’app.

Références :
- https://docs.stripe.com/billing/subscriptions/build-subscriptions?payment-ui=mobile&platform=react-native
- https://docs.expo.dev/versions/latest/sdk/stripe/
- https://docs.stripe.com/billing/subscriptions/twint
- https://docs.stripe.com/apple-pay
- https://docs.stripe.com/google-pay?platform=web
