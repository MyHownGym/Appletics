# Serveur Appletics (Supabase)

Déploiement automatique via l'intégration GitHub de Supabase (option « Deploy to production ») à chaque mise à jour de `main` :

- `migrations/` : fichiers SQL appliqués une seule fois chacun, dans l'ordre de leur nom. Ils sont ré-exécutables sans risque.
- `functions/` : fonctions serveur déclarées dans `config.toml`, redéployées quand leur code change.

Les **secrets** ne sont jamais dans le code : Supabase > Edge Functions > Secrets
(`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`).

`schema/` garde des copies lisibles des scripts (à coller à la main dans le SQL Editor si besoin).
