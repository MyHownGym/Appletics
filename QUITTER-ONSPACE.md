# Appletics sans OnSpace

Tu remplaces OnSpace par trois comptes à ton nom :

| Rôle | Avant | Après | Prix au départ |
|---|---|---|---|
| Serveur (comptes, groupes, messages) | OnSpace Cloud | **Supabase** (supabase.com) | gratuit |
| Paiements | Stripe via OnSpace | **ton Stripe** (stripe.com) | commission par paiement |
| Build iPhone | OnSpace | **Expo EAS** (expo.dev) | gratuit (30 builds/mois) |
| Web app | — | **Netlify** ou Vercel | gratuit |

Le code est déjà adapté. Il n'y a plus rien à faire dans OnSpace.

---

## 1. Créer le serveur Supabase (15 min)

1. Va sur supabase.com, clique sur **Start your project** et connecte-toi avec GitHub.
2. Clique sur **New project** :
   - **Name** : `appletics`
   - **Database password** : génère-le et garde-le.
   - **Region** : **Central EU (Zurich)**, pour que les données restent en Suisse.
3. Une fois le projet prêt, ouvre **SQL Editor** puis **New query**.
4. Colle tout le contenu de `supabase/schema/appletics_schema_complet.sql`, puis clique sur **Run**.
   Le résultat attendu est « Success ». Tu peux relancer le script sans risque.
5. Dans **Authentication > URL Configuration** :
   - **Site URL** : `https://app.appletics.ch`
   - **Redirect URLs** : ajoute `https://app.appletics.ch/**`, `appletics://**` et `http://localhost:8081/**`.
6. Dans **Authentication > Emails > Templates**, dans « Confirm signup » **et** « Magic Link », remplace le texte par :
   `Votre code Appletics : {{ .Token }}`
   L'app demande un code reçu par e-mail, pas un lien.
7. **Important avant le lancement** : dans **Authentication > Emails > SMTP Settings**, branche un
   service d'e-mails. Sans cela, Supabase n'envoie que quelques e-mails par heure.
   Resend.com est gratuit jusqu'à 3 000 e-mails par mois. Il faut vérifier le domaine appletics.ch chez eux.

**Accès à Supabase** : c'est ton compte. Tout se gère sur supabase.com/dashboard : utilisateurs
(Authentication > Users), données (Table Editor), messages signalés (table `message_reports`).

## 2. Brancher l'app sur ton serveur

Dans Supabase, ouvre **Project Settings > API**, copie **Project URL** et la clé **anon public** (onglet « Legacy API keys » si elle n'apparaît pas tout de suite), puis
remplace les deux lignes du fichier `.env` :

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. Mettre en ligne les fonctions de paiement

Sur ton ordinateur, dans le dossier du code (Node.js 20 ou plus requis) :

```sh
npm install
npx supabase login
npx supabase link --project-ref xxxxxxxx      # xxxxxxxx est dans l'URL du projet
npx supabase functions deploy appletics-billing appletics-billing-return appletics-delete-account --no-verify-jwt
```

## 4. Stripe

1. Crée ou ouvre ton compte sur stripe.com et active les paiements réels : identité, IBAN, entreprise.
2. Dans **Développeurs > Clés API**, copie la clé secrète et la clé publiable.
3. Enregistre-les dans Supabase :

```sh
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_PUBLISHABLE_KEY=pk_live_...
```

- Avec les clés `sk_test_` / `pk_test_`, ce sont des paiements d'essai (carte 4242 4242 4242 4242).
  **Commence par là**, puis passe aux clés `sk_live_`.
- Avec les clés `sk_live_`, ce sont de vrais paiements. Les mentions « TEST » disparaissent de l'app.
- Les tarifs (Basic 5.90, Pro 9.90, Elite 19.90, Club…) **se créent tout seuls** dans Stripe au premier
  passage sur l'écran Abonnement. Tu n'as rien à créer à la main.

## 5. Web app

```sh
npx expo export --platform web --output-dir dist
```

Glisse le dossier `dist` sur app.netlify.com/drop, puis relie le domaine `app.appletics.ch`.

## 6. App iPhone

Suis `BUILD-IOS.md` : un compte gratuit sur expo.dev, puis `eas build` et `eas submit`.
L'identifiant `app.onspace.appletics` est conservé, car ta fiche App Store y est liée. Ce n'est qu'un nom
et il ne dépend pas d'OnSpace. Rappel : sur iPhone, l'abonnement ne s'achète pas dans l'app ;
il s'achète via la web app.

## Ce qui ne suit pas

- **Les comptes de test créés sur OnSpace** : il faut les recréer, car c'est un nouveau serveur.
  L'app n'est pas encore lancée, donc aucun client n'est touché.
- Les données gardées sur le téléphone (plans, athlètes locaux) restent sur le téléphone.

## Fermer OnSpace

Tu peux résilier OnSpace quand ces trois points sont vérifiés :

- la web app sur ton domaine permet de créer un compte et de recevoir le code ;
- un paiement test passe ;
- une build TestFlight faite avec EAS démarre.

Garde une copie de ce dossier de code (ou ton dépôt GitHub) : c'est désormais la seule source.
