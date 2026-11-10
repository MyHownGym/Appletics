// Appletics — rappels de fin d'essai gratuit (30 jours) : e-mail + notification, 7 jours et 1 jour avant la fin.
// Fichier autonome : à coller dans Supabase > Edge Functions > appletics-trial-reminders (Via Editor), puis Deploy.
// « Verify JWT » désactivé : la fonction est appelée chaque matin par le planificateur (pg_cron) avec CRON_SECRET.
// Secrets utilisés : CRON_SECRET (nouveau), SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM,
// VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, APP_URL (déjà configurés pour les invitations et notifications).
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import webpush from 'npm:web-push@3.6.7';

const TRIAL_DAYS = 30;
const LAUNCH = Date.parse('2026-12-01T00:00:00+01:00'); // the trial never starts before the launch (same rule as the app)
const DAY = 86400000;
const REMIND_AT = [7, 1];
type Lang = 'fr' | 'de' | 'it';

const copy: Record<Lang, { subject: (d: number) => string; title: (d: number) => string; body: (d: number, end: string) => string; cta: string; footer: string }> = {
  fr: {
    subject: d => d > 1 ? `Plus que ${d} jours d’essai gratuit sur Appletics` : 'Dernier jour d’essai gratuit sur Appletics',
    title: d => d > 1 ? `Plus que ${d} jours d’essai` : 'Ton essai se termine demain',
    body: (d, end) => `Ton essai gratuit avec toutes les fonctions Pro se termine le ${end}. Choisis ta formule pour continuer à créer tes plans et compétitions — tes données restent à toi dans tous les cas.`,
    cta: 'Choisir ma formule', footer: 'Tu reçois cet e-mail car tu as créé un compte Appletics.',
  },
  de: {
    subject: d => d > 1 ? `Noch ${d} Tage Gratis-Test bei Appletics` : 'Letzter Tag deines Gratis-Tests bei Appletics',
    title: d => d > 1 ? `Noch ${d} Tage Test` : 'Dein Test endet morgen',
    body: (d, end) => `Dein Gratis-Test mit allen Pro-Funktionen endet am ${end}. Wähle dein Abo, um weiterhin Pläne und Wettkämpfe zu erstellen — deine Daten bleiben in jedem Fall erhalten.`,
    cta: 'Abo wählen', footer: 'Du erhältst diese E-Mail, weil du ein Appletics-Konto erstellt hast.',
  },
  it: {
    subject: d => d > 1 ? `Ancora ${d} giorni di prova gratuita su Appletics` : 'Ultimo giorno di prova gratuita su Appletics',
    title: d => d > 1 ? `Ancora ${d} giorni di prova` : 'La tua prova finisce domani',
    body: (d, end) => `La tua prova gratuita con tutte le funzioni Pro termina il ${end}. Scegli il tuo piano per continuare a creare piani e gare — i tuoi dati restano tuoi in ogni caso.`,
    cta: 'Scegli il piano', footer: 'Ricevi questa e-mail perché hai creato un account Appletics.',
  },
};
const locale: Record<Lang, string> = { fr: 'fr-CH', de: 'de-CH', it: 'it-CH' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

function emailHtml(lang: Lang, days: number, end: string, url: string) {
  const t = copy[lang];
  return `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:520px;background:#fff;border-radius:20px;overflow:hidden" cellpadding="0" cellspacing="0">
<tr><td style="background:linear-gradient(135deg,#E2461A,#FF8A65);padding:28px 28px;color:#fff">
<div style="font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;opacity:.9">Appletics</div>
<div style="font-size:26px;font-weight:800;margin-top:6px">${esc(t.title(days))}</div></td></tr>
<tr><td style="padding:24px 28px;color:#334155;font-size:16px;line-height:1.55">${esc(t.body(days, end))}
<div style="margin-top:24px"><a href="${url}" style="display:inline-block;background:#FF5722;color:#fff;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:14px">${esc(t.cta)}</a></div></td></tr>
<tr><td style="padding:0 28px 24px;color:#94a3b8;font-size:12px">${esc(t.footer)}</td></tr>
</table></td></tr></table></body></html>`;
}

async function isPaidOrFounder(admin: SupabaseClient, userId: string, email: string) {
  const { data: ent } = await admin.from('billing_test_entitlements').select('status, current_period_end').eq('user_id', userId).maybeSingle();
  if (ent && ['active', 'trialing', 'past_due'].includes(ent.status) && (!ent.current_period_end || Date.parse(ent.current_period_end) > Date.now())) return true;
  if (!email) return false;
  const { data: founder } = await admin.from('appletics_founder_access').select('expires_at').eq('email', email.toLowerCase()).maybeSingle();
  return !!founder && (!founder.expires_at || Date.parse(founder.expires_at) > Date.now());
}

Deno.serve(async req => {
  const secret = Deno.env.get('CRON_SECRET');
  if (!secret || req.headers.get('x-cron-secret') !== secret) return json({ error: 'forbidden' }, 403);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const appUrl = (Deno.env.get('APP_URL') ?? 'https://app.appletics.ch').replace(/\/+$/, '');
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY'), vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
  if (vapidPublic && vapidPrivate) webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@appletics.ch', vapidPublic, vapidPrivate);
  const host = Deno.env.get('SMTP_HOST'), user = Deno.env.get('SMTP_USER'), password = Deno.env.get('SMTP_PASSWORD');
  const port = Number(Deno.env.get('SMTP_PORT') ?? '465'), from = Deno.env.get('SMTP_FROM') ?? user;
  const smtp = host && user && password ? new SMTPClient({ connection: { hostname: host, port, tls: port === 465, auth: { username: user, password } } }) : null;
  const report = { checked: 0, emails: 0, pushes: 0, skipped: 0 };

  for (let page = 1; page < 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: error.message }, 500);
    for (const account of data.users) {
      report.checked++;
      const start = Math.max(Date.parse(account.created_at), LAUNCH);
      const end = start + TRIAL_DAYS * DAY;
      const daysLeft = Math.ceil((end - Date.now()) / DAY);
      if (!REMIND_AT.includes(daysLeft)) continue;
      const { data: profileRow } = await admin.from('user_profiles').select('appletics_profile, account_deleted_at').eq('id', account.id).maybeSingle();
      const profile = (profileRow?.appletics_profile ?? {}) as { userType?: string; language?: string };
      if (profileRow?.account_deleted_at || profile.userType === 'athlete' || await isPaidOrFounder(admin, account.id, account.email ?? '')) { report.skipped++; continue; }
      // Once per reminder and account, even if the job runs twice.
      const { error: dup } = await admin.from('trial_reminders').insert({ user_id: account.id, kind: `d${daysLeft}` });
      if (dup) { report.skipped++; continue; }
      const lang: Lang = (['fr', 'de', 'it'] as const).includes(profile.language as Lang) ? profile.language as Lang : 'fr';
      const t = copy[lang];
      const endLabel = new Date(end).toLocaleDateString(locale[lang], { day: 'numeric', month: 'long' });
      const url = `${appUrl}/upgrade`;
      if (smtp && account.email) {
        try {
          await smtp.send({ from: `Appletics <${from}>`, to: account.email, subject: t.subject(daysLeft), content: `${t.title(daysLeft)}\n\n${t.body(daysLeft, endLabel)}\n\n${t.cta} : ${url}`, html: emailHtml(lang, daysLeft, endLabel, url) });
          report.emails++;
        } catch (e) { console.warn('[trial-reminders] mail', e instanceof Error ? e.message : e); }
      }
      if (vapidPublic && vapidPrivate) {
        const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', account.id);
        for (const row of subs ?? []) {
          try {
            await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify({ title: t.title(daysLeft), body: t.body(daysLeft, endLabel), url: '/upgrade', tag: `trial-d${daysLeft}` }), { TTL: 24 * 3600 });
            report.pushes++;
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) await admin.from('push_subscriptions').delete().eq('id', row.id);
          }
        }
      }
    }
    if (data.users.length < 1000) break;
  }
  if (smtp) { try { await smtp.close(); } catch { /* already closed */ } }
  return json(report);
});
