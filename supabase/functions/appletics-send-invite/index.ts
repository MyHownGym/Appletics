// Appletics — envoi de l'e-mail d'invitation (fichier autonome : peut être collé tel quel
// dans Supabase > Edge Functions > Deploy a new function > Via Editor, nom « appletics-send-invite »).
//
// Secrets à définir dans Supabase > Edge Functions > Secrets :
//   SMTP_HOST      ex. asmtp.mail.hostpoint.ch
//   SMTP_PORT      ex. 465
//   SMTP_USER      ex. contact@appletics.ch
//   SMTP_PASSWORD  mot de passe de cette boîte
//   SMTP_FROM      ex. contact@appletics.ch   (facultatif, sinon SMTP_USER)
//   APP_URL        ex. https://app.appletics.ch
//
// L'app appelle cette fonction juste après avoir créé une invitation. Seul le coach qui a créé
// l'invitation (ou un coach du groupe) peut déclencher l'envoi, au plus 60 envois par 24 h.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));

type Lang = 'fr' | 'de' | 'it';
const copy: Record<Lang, { subject: (coach: string) => string; intro: (coach: string, group: string) => string; roleAthlete: string; roleCoach: string; steps: string[]; button: string; email: string; footer: string }> = {
  fr: {
    subject: coach => `${coach} vous invite sur Appletics`,
    intro: (coach, group) => `<strong>${coach}</strong> vous invite à rejoindre le groupe <strong>« ${group} »</strong> sur Appletics, l’app des coachs et athlètes d’athlétisme.`,
    roleAthlete: 'athlète', roleCoach: 'coach',
    steps: ['Ouvrez Appletics avec le bouton ci-dessous.', 'Créez votre compte avec cette adresse e-mail :', 'Acceptez l’invitation qui s’affiche dans Groupes partagés.'],
    button: 'Ouvrir Appletics', email: 'Rôle', footer: 'Vous recevez cet e-mail car un coach a saisi votre adresse dans Appletics. Si vous ne connaissez pas cette personne, ignorez simplement ce message.',
  },
  de: {
    subject: coach => `${coach} lädt Sie zu Appletics ein`,
    intro: (coach, group) => `<strong>${coach}</strong> lädt Sie ein, der Gruppe <strong>«${group}»</strong> auf Appletics beizutreten, der App für Leichtathletik-Trainer und -Athleten.`,
    roleAthlete: 'Athlet/in', roleCoach: 'Trainer/in',
    steps: ['Öffnen Sie Appletics mit der Schaltfläche unten.', 'Erstellen Sie Ihr Konto mit dieser E-Mail-Adresse:', 'Nehmen Sie die Einladung unter «Gemeinsame Gruppen» an.'],
    button: 'Appletics öffnen', email: 'Rolle', footer: 'Sie erhalten diese E-Mail, weil ein Trainer Ihre Adresse in Appletics eingegeben hat. Wenn Sie diese Person nicht kennen, ignorieren Sie diese Nachricht.',
  },
  it: {
    subject: coach => `${coach} ti invita su Appletics`,
    intro: (coach, group) => `<strong>${coach}</strong> ti invita a unirti al gruppo <strong>«${group}»</strong> su Appletics, l’app per allenatori e atleti di atletica.`,
    roleAthlete: 'atleta', roleCoach: 'allenatore',
    steps: ['Apri Appletics con il pulsante qui sotto.', 'Crea il tuo account con questo indirizzo email:', 'Accetta l’invito in «Gruppi condivisi».'],
    button: 'Apri Appletics', email: 'Ruolo', footer: 'Ricevi questa email perché un allenatore ha inserito il tuo indirizzo in Appletics. Se non conosci questa persona, ignora questo messaggio.',
  },
};

function buildEmail(lang: Lang, coach: string, group: string, role: string, email: string, appUrl: string) {
  const text = copy[lang];
  const c = escapeHtml(coach), g = escapeHtml(group), e = escapeHtml(email), url = escapeHtml(appUrl);
  const roleLabel = role === 'coach' ? text.roleCoach : text.roleAthlete;
  const html = `<!doctype html><html><body style="margin:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#FF4F17;padding:20px 28px;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px">APPLETICS</td></tr>
<tr><td style="padding:28px">
<p style="font-size:17px;line-height:1.5;margin:0 0 18px">${text.intro(c, g)}</p>
<p style="font-size:14px;color:#555;margin:0 0 18px">${text.email} : ${escapeHtml(roleLabel)}</p>
<ol style="font-size:15px;line-height:1.6;padding-left:20px;margin:0 0 24px">
<li>${text.steps[0]}</li><li>${text.steps[1]} <strong>${e}</strong></li><li>${text.steps[2]}</li></ol>
<p style="text-align:center;margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#FF4F17;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:10px">${text.button}</a></p>
<p style="font-size:13px;color:#777;margin:0 0 6px;word-break:break-all">${url}</p>
</td></tr>
<tr><td style="padding:18px 28px;background:#fafafa;font-size:12px;color:#888;line-height:1.5">${text.footer}</td></tr>
</table></td></tr></table></body></html>`;
  const plain = `${coach} — ${group}\n\n1. ${text.steps[0]}\n${appUrl}\n2. ${text.steps[1]} ${email}\n3. ${text.steps[2]}\n\n${text.footer}`;
  return { subject: text.subject(coach), html, plain };
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await admin.auth.getUser(token);
    const user = auth?.user;
    if (!user) return json({ error: 'Connectez-vous pour envoyer une invitation.' }, 401);

    const body = await request.json().catch(() => ({}));
    const invitationId = typeof body.invitationId === 'string' ? body.invitationId : '';
    const lang: Lang = ['fr', 'de', 'it'].includes(body.language) ? body.language : 'fr';
    if (!/^[0-9a-f-]{36}$/i.test(invitationId)) return json({ error: 'Invitation invalide.' }, 400);

    const { data: invitation } = await admin.from('shared_group_invitations')
      .select('id, group_id, group_name, email, role, status, invited_by, expires_at').eq('id', invitationId).maybeSingle();
    if (!invitation || invitation.status !== 'pending' || new Date(invitation.expires_at).getTime() <= Date.now()) return json({ error: 'Invitation introuvable ou expirée.' }, 404);

    const { data: me } = await admin.from('shared_group_members').select('role, display_name')
      .eq('group_id', invitation.group_id).eq('user_id', user.id).maybeSingle();
    if (!me || (me.role !== 'coach' && invitation.invited_by !== user.id)) return json({ error: 'Accès refusé.' }, 403);

    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await admin.from('shared_group_invitations').select('id', { count: 'exact', head: true })
      .eq('invited_by', user.id).gte('created_at', since);
    if ((count ?? 0) > 60) return json({ error: 'Trop d’invitations aujourd’hui. Réessayez demain.' }, 429);

    const host = Deno.env.get('SMTP_HOST'), username = Deno.env.get('SMTP_USER'), password = Deno.env.get('SMTP_PASSWORD');
    if (!host || !username || !password) return json({ error: 'Envoi d’e-mails non configuré sur le serveur.' }, 503);
    const port = Number(Deno.env.get('SMTP_PORT') ?? '465');
    const from = Deno.env.get('SMTP_FROM') ?? username;
    const appUrl = (Deno.env.get('APP_URL') ?? 'https://app.appletics.ch').replace(/\/+$/, '');

    const coachName = (me.display_name || user.email?.split('@')[0] || 'Votre coach').slice(0, 80);
    const mail = buildEmail(lang, coachName, invitation.group_name || 'Appletics', invitation.role, invitation.email, appUrl);
    const client = new SMTPClient({ connection: { hostname: host, port, tls: port === 465, auth: { username, password } } });
    try {
      await client.send({ from: `Appletics <${from}>`, to: invitation.email, replyTo: user.email ?? undefined, subject: mail.subject, content: mail.plain, html: mail.html });
    } finally {
      await client.close().catch(() => {});
    }
    return json({ sent: true });
  } catch (error) {
    console.error('[appletics-send-invite]', error instanceof Error ? error.message : error);
    return json({ error: 'L’e-mail n’a pas pu être envoyé. Réessayez plus tard.' }, 500);
  }
});
