// Appletics — notification « nouveau message » envoyée aux autres membres du groupe (web push).
// Fichier autonome : peut être collé tel quel dans Supabase > Edge Functions > Deploy a new function > Via Editor,
// nom « appletics-notify-message ».
// Secrets (Supabase > Edge Functions > Secrets) : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex. mailto:contact@appletics.ch)
// et APP_URL (déjà défini pour les invitations).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  try {
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY'), privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) return json({ error: 'Notifications non configurées sur le serveur.' }, 503);
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@appletics.ch', publicKey, privateKey);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await admin.auth.getUser(token);
    const user = auth?.user;
    if (!user) return json({ error: 'Connectez-vous.' }, 401);

    const body = await request.json().catch(() => ({}));
    const messageId = typeof body.messageId === 'string' ? body.messageId : '';
    if (!/^[0-9a-f-]{36}$/i.test(messageId)) return json({ error: 'Message invalide.' }, 400);

    // Only the author can trigger the notification of their own message, once, within 5 minutes.
    const { data: message } = await admin.from('group_messages').select('id, group_id, sender_id, sender_name, body, created_at').eq('id', messageId).maybeSingle();
    if (!message || message.sender_id !== user.id) return json({ error: 'Accès refusé.' }, 403);
    if (Date.now() - new Date(message.created_at).getTime() > 5 * 60 * 1000) return json({ sent: 0 });

    const [{ data: group }, { data: members }, { data: blocks }] = await Promise.all([
      admin.from('shared_groups').select('name').eq('id', message.group_id).maybeSingle(),
      admin.from('shared_group_members').select('user_id').eq('group_id', message.group_id),
      admin.from('user_blocks').select('blocker_id').eq('blocked_id', user.id),
    ]);
    const blockedBy = new Set((blocks ?? []).map(row => row.blocker_id));
    const recipients = (members ?? []).map(row => row.user_id).filter(id => id !== user.id && !blockedBy.has(id));
    if (!recipients.length) return json({ sent: 0 });

    const { data: subscriptions } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').in('user_id', recipients);
    const appUrl = (Deno.env.get('APP_URL') ?? 'https://app.appletics.ch').replace(/\/+$/, '');
    const payload = JSON.stringify({
      title: `${message.sender_name || 'Nouveau message'} · ${group?.name ?? 'Appletics'}`,
      body: message.body.length > 140 ? `${message.body.slice(0, 137)}…` : message.body,
      url: `${appUrl}/group-chat?id=${message.group_id}`,
      tag: `group-${message.group_id}`,
    });
    let sent = 0;
    const expired: string[] = [];
    await Promise.all((subscriptions ?? []).map(async row => {
      try {
        await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload, { TTL: 3600 });
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) expired.push(row.id); // subscription no longer valid
        else console.warn('[appletics-notify-message] push', status, error instanceof Error ? error.message : error);
      }
    }));
    if (expired.length) await admin.from('push_subscriptions').delete().in('id', expired);
    return json({ sent });
  } catch (error) {
    console.error('[appletics-notify-message]', error instanceof Error ? error.message : error);
    return json({ error: 'Notification non envoyée.' }, 500);
  }
});
