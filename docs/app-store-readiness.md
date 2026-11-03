# Appletics — état avant publication

## Conclusion au 25 octobre 2026

**L’app n’est pas encore prête pour une publication commerciale complète.** Passer le tableau de bord Stripe en production ou changer sa clé ne suffit pas. La bêta TestFlight dispose maintenant d’une configuration de build dédiée, d’achats iOS désactivés, d’une suppression sécurisée et d’indications de limites. Elle n’a pas été compilée, signée, testée sur appareil ou envoyée à Apple dans cette session ; voir `docs/testflight-release.md`.

## Blocages constatés dans le code

1. **Facturation strictement test.** `constants/billing.ts` conserve `BILLING_TEST_MODE = true`. L’Edge Function refuse les clés live avant toute écriture, le catalogue utilise les tarifs de test, le client refuse les réponses live et la PaymentSheet exige `pk_test_`. Un simple changement de clé ne rend donc pas la facturation fonctionnelle en production. Les comptes et droits de facturation de test sont séparés.
2. **Modèle commercial iOS à décider avant d’activer Stripe live.** Les formules déverrouillent des fonctionnalités numériques de l’app. Les achats intégrés Apple sont en principe requis pour ces achats dans l’app ; les exceptions dépendent du modèle, du pays/storefront et des conditions Apple applicables. Le fait de gérer un club sportif ne suffit pas à classer une formule logicielle comme un service sportif physique. Apple Pay via Stripe n’est pas un achat intégré StoreKit. Il faut une intégration autorisée pour les storefronts visés, pas seulement un passage de Stripe en live.
3. **Discussions encore locales.** `AppContext.sendMessage` ajoute des messages au stockage de l’appareil. Cela ne permet pas encore une conversation entre deux comptes sur des téléphones différents. Les groupes/performance Cloud sont un module distinct.
4. **Administration club/comité partielle.** L’annuaire de coachs du club et certains statuts restent locaux ; les permissions comité et quotas facturés doivent être finalisés côté serveur. Les groupes partagés ne constituent pas à eux seuls l’administration distante d’un club.
5. **Suppression distante implémentée, à tester.** Réglages demande le mot de passe avant l’Edge Function `appletics-delete-account`. Le serveur vérifie le JWT et le mot de passe, clôture le client Stripe de test, efface les données privées et les groupes détenus, puis supprime irréversiblement la connexion. Certaines contributions aux groupes d’autres utilisateurs gardent un UUID technique sans profil ni coordonnées, comme annoncé dans le dialogue. Les droits d’un JWT encore valide sont bloqués par RLS. Les anciens contrats externes/live, s’ils sont ajoutés hors bêta, ne sont pas pris en charge par ce flux et doivent être traités avant une publication commerciale.
6. **Pas de garantie de sauvegarde globale.** Les données sportives non explicitement partagées, photos de profil et discussions restent sur l’appareil. Réinstallation ou changement de téléphone ne restaurent pas automatiquement cet historique. L’interface et les déclarations de confidentialité doivent refléter cette limite.

## À préparer / valider dans les comptes externes et les builds

- Identifiant iOS définitif, nom affiché, signature, compte Apple Developer et fiche App Store Connect. Ne pas inventer de lien App Store avant publication.
- Nouveau build intégrant les schémas de retour configurés (`onspaceapp` et `appletics`) ; le retour hébergé doit être testé via une nouvelle session Stripe depuis l’app, pas seulement un onglet Safari déjà ouvert.
- TestFlight et appareils physiques : connexion/OTP, mauvais mot de passe, Face ID et secours, caméra/photothèque, clavier, paiements et annulations, résiliation/réactivation/changements programmés, redémarrage et changement de compte.
- Tests de permissions avec deux coachs, un athlète et un compte extérieur : invitations, révocation, conflits d’édition et impossibilité de lire les données d’un autre groupe.
- Hors bêta TestFlight, Merchant ID/certificat Apple Pay si ce moyen de paiement est conservé pour un usage autorisé. Le plugin seul ne crée pas la capacité ou le certificat Apple.
- Politique de confidentialité, conditions, fiche de confidentialité Apple, données de mineurs, textes d’abonnement/prix/renouvellement et informations de contact cohérentes. Vérifier les URLs publiques et leur contenu.
- Si le chat devient distant : signalement/blocage et mesures adaptées pour les contenus créés par les utilisateurs.
- Compte de revue fonctionnel et instructions pour Apple, backend accessible, métadonnées et captures exactes. Une compilation réussie ou un essai Stripe réussi ne garantit pas l’acceptation.

## Références

- https://developer.apple.com/app-store/review/guidelines/ (achats numériques, suppression de compte, contenu utilisateur et revue)
- https://developer.apple.com/in-app-purchase/
- https://docs.expo.dev/versions/latest/sdk/webbrowser/

Aucun paiement live, compte utilisateur, donnée sportive ou abonnement existant n’a été supprimé ou migré pour établir cet état.
