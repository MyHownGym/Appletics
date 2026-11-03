# Compte unique et groupes partagés

## Essai sur deux appareils / comptes distincts
1. Onboarding Coach, Athlète ou Club : prénom obligatoire. L’étape Compte demande e-mail, mot de passe et confirmation ; inscription par code e-mail à 4 chiffres. Minimum : 6 caractères. Un compte existant peut être réutilisé.
2. Le compte se restaure via AuthProvider. Un profil sécurisé enregistré est réutilisé sur un autre appareil. Aucune copie du mot de passe dans AsyncStorage, profils ou tables sportives.
3. Connexion : Face ID / biométrie ou code de l’appareil en secours. Si ceux-ci échouent, saisir le mot de passe Appletics. Sans session serveur, la biométrie seule ne donne pas accès au compte distant.
4. Les photos proposent Photothèque, Fichiers ou Caméra ; JPEG compressé 512 px, fichier durable local. Les photos restent locales sur cet appareil et ne sont pas synchronisées dans Cloud. Refaire un build iOS/Android pour les permissions caméra. Ne pas utiliser le nom générique Coach / Athlète comme prénom.

## Partager
1. Profil > Groupes partagés > Créer un groupe, connecté comme coach ou administrateur club.
2. Ajouter un athlète au groupe, ou importer explicitement une fiche locale. Cette opération crée une fiche Cloud ; les fiches locales ne sont pas automatiquement déplacées.
3. Inviter un coach avec son e-mail. Pour un athlète, sélectionner la fiche non liée puis son e-mail. L’invitation est valable 14 jours et visible dans l’app du destinataire après sa connexion. Dans Invitations en attente, « Préparer un e-mail Appletics » ouvre votre messagerie avec le groupe, le rôle et les instructions d’acceptation. L’envoi reste manuel, jamais automatique.
4. Le destinataire accepte ou refuse. Les invitations ne donnent aucun accès avant acceptation. Les coachs d’un même groupe voient les mêmes fiches, séances et performances. Un coach peut être membre de plusieurs groupes.
5. Publier une séance dans le groupe, ou ouvrir une séance locale > Partager cette séance. Les clés sources incluent l’identité du coach pour éviter les collisions entre les données locales d’appareils différents.
6. Dans le groupe, sélectionner une séance > Enregistrer une performance. L’athlète ne peut écrire que sur sa fiche explicitement liée ; les coachs du groupe peuvent écrire pour tous les athlètes de ce groupe. Date et plusieurs mesures sont disponibles.
7. Depuis une séance locale, sélectionner explicitement groupe et séance partagée pour reprendre une ancienne performance. Le stockage local existant est conservé ; rien n’est publié sans choix du groupe / séance.
8. Enregistrement Cloud confirmé avant fermeture du formulaire. Modification avec contrôle de version : une seconde modification sur une ancienne version est refusée, jamais écrasée silencieusement. Le créateur et le dernier auteur sont affichés ; les modifications et suppressions sont journalisées côté serveur.
9. Synchronisation par interrogation toutes les 15 secondes et au retour au premier plan (pas de Realtime), plus Actualiser. Hors ligne : message d’erreur, aucune fausse confirmation de partage.
10. Le propriétaire du groupe peut retirer un membre ; les coachs peuvent révoquer une invitation. Les performances sont lisibles par les coachs autorisés et l’athlète concerné, pas par les autres athlètes ni les visiteurs.

## Liens des invitations
- Tous les nouveaux messages utilisent la marque **Appletics** et le site officiel **https://www.appletics.ch/**, pour les athlètes comme pour les coachs. Aucun chemin d’inscription web ni lien App Store non fourni n’est inventé.
- Le site est un lien d’information, pas un téléchargement ou une acceptation automatique. Le message indique que le lien App Store sera disponible après publication.
- Ajouter un athlète > Invitation prépare un e-mail ou un SMS dans la langue sélectionnée (français, allemand, italien). iOS utilise le séparateur Messages `&body`, Android `?body`.
- Un message général envoyé depuis Ajouter un athlète ne crée pas de permission Cloud : créer une invitation dans un groupe partagé pour accorder l’accès, puis attendre son acceptation.
- Les anciens e-mails et SMS déjà envoyés ne peuvent pas être modifiés. Préparer et envoyer une nouvelle invitation pour transmettre le lien corrigé.

## Contrôles avant publication
- Installer un nouveau build pour caméra / biométrie ; tester caméra acceptée/refusée, fichiers et photothèque annulés, JPG/PNG/HEIC, orientation et petits écrans.
- Tester clavier du résumé Stripe (paysage/portrait, e-mail, mot de passe, code), compte existant et création de compte.
- Tester mot de passe correct/incorrect, biométrie refusée, code indisponible, session expirée. AuthProvider reste l’unique source de session.
- Tester deux coachs, un athlète lié, un autre athlète et un compte extérieur. Les derniers ne doivent jamais obtenir les performances du premier athlète.
- Tester acceptation double, invitation expirée/refusée/révoquée, retrait d’un coach et deux modifications simultanées.
- Chaque compte dispose maintenant de son espace sportif local distinct (athlètes, plans, compétitions, résultats, séances, discussions). À la première connexion, un historique d’installation non attribué est conservé et son rattachement est demandé explicitement. Changer de compte masque immédiatement les données du précédent. L’ancien stockage n’est pas supprimé automatiquement. Les nouvelles données d’un compte commencent vides, sans athlètes ni messages de démonstration. Les tables shared_* sont séparées des athlètes, plans, compétitions, chats et factures existants.
- Ces groupes collaboratifs ne remplacent pas les permissions comité ni les quotas facturés du module Administration club ; aucun compte Stripe / paiement / webhook n’est modifié.
- Les tests mobiles natifs et de permissions sur comptes réels ne sont pas exécutables depuis cette session d’édition ; les vérifier sur les builds installés.
