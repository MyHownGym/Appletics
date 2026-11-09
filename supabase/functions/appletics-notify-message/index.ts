// Appletics — notifications (web push) :
//   • nouveau message dans un groupe            → les autres membres
//   • nouvelles séances / compétitions du coach → l'athlète concerné
//   • résultat saisi par l'athlète              → les coachs du groupe
//   • résultat saisi par le coach               → l'athlète concerné
// Fichier autonome : à coller dans Supabase > Edge Functions > appletics-notify-message (Via Editor), puis Deploy.
// Secrets : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, APP_URL.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const isId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
const short = (text: string, max = 140) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);
const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;

interface Push { title: string; body: string; url: string; tag: string }

// Sends one notification to every registered device of these accounts; forgets expired devices.
async function sendTo(admin: SupabaseClient, userIds: string[], push: Push) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return 0;
  const { data: subscriptions } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').in('user_id', ids);
  const payload = JSON.stringify(push);
  let sent = 0; const expired: string[] = [];
  await Promise.all((subscriptions ?? []).map(async row => {
    try { await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload, { TTL: 6 * 3600 }); sent++; }
    catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) expired.push(row.id);
      else console.warn('[appletics-notify] push', status, error instanceof Error ? error.message : error);
    }
  }));
  if (expired.length) await admin.from('push_subscriptions').delete().in('id', expired);
  return sent;
}

async function isCoach(admin: SupabaseClient, groupId: string, userId: string) {
  const { data } = await admin.from('shared_group_members').select('role').eq('group_id', groupId).eq('user_id', userId).maybeSingle();
  return data?.role === 'coach';
}
async function displayName(admin: SupabaseClient, groupId: string, userId: string, fallback: string) {
  const { data } = await admin.from('shared_group_members').select('display_name').eq('group_id', groupId).eq('user_id', userId).maybeSingle();
  return data?.display_name || fallback;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
  try {
    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY'), privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) return json({ error: 'Notifications non configurées sur le serveur.' }, 503);
    webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@appletics.ch', publicKey, privateKey);
    const appUrl = (Deno.env.get('APP_URL') ?? 'https://app.appletics.ch').replace(/\/+$/, '');

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth } = await admin.auth.getUser(token);
    const user = auth?.user;
    if (!user) return json({ error: 'Connectez-vous.' }, 401);
    const body = await request.json().catch(() => ({}));
    const fallbackName = user.email?.split('@')[0] ?? 'Appletics';

    // ── New sessions / competitions sent by the coach to one athlete ─────────────────────
    if (body.event === 'items') {
      if (!isId(body.athleteId)) return json({ error: 'Athlète invalide.' }, 400);
      const sessions = Math.max(0, Math.min(99, Number(body.sessions) || 0));
      const competitions = Math.max(0, Math.min(99, Number(body.competitions) || 0));
      if (!sessions && !competitions) return json({ sent: 0 });
      const { data: athlete } = await admin.from('shared_athletes').select('group_id, user_id').eq('id', body.athleteId).maybeSingle();
      if (!athlete?.user_id || !(await isCoach(admin, athlete.group_id, user.id))) return json({ sent: 0 });
      const coach = await displayName(admin, athlete.group_id, user.id, fallbackName);
      const parts = [sessions ? plural(sessions, 'nouvelle séance', 'nouvelles séances') : '', competitions ? plural(competitions, 'compétition', 'compétitions') : ''].filter(Boolean).join(' et ');
      const first = typeof body.firstTitle === 'string' ? short(body.firstTitle.trim(), 60) : '';
      const sent = await sendTo(admin, [athlete.user_id], {
        title: `${coach} · nouveau programme`,
        body: `${parts}${first ? ` : ${first}` : ''}`,
        url: competitions && !sessions ? `${appUrl}/competitions` : `${appUrl}/plans`,
        tag: `items-${athlete.group_id}`,
      });
      return json({ sent });
    }

    // ── A result was entered (by the athlete → coaches, by a coach → the athlete) ──────────
    if (body.event === 'result') {
      if (!isId(body.sessionId) || !isId(body.athleteId)) return json({ error: 'Résultat invalide.' }, 400);
      const [{ data: row }, { data: athlete }, { data: performance }] = await Promise.all([
        admin.from('shared_sessions').select('id, group_id, title, kind').eq('id', body.sessionId).maybeSingle(),
        admin.from('shared_athletes').select('id, group_id, user_id, name').eq('id', body.athleteId).maybeSingle(),
        admin.from('shared_performances').select('metrics, updated_at, updated_by').eq('session_id', body.sessionId).eq('athlete_id', body.athleteId).maybeSingle(),
      ]);
      if (!row || !athlete || athlete.group_id !== row.group_id || !performance) return json({ sent: 0 });
      // Only the person who just saved it, within 5 minutes, can announce it.
      if (performance.updated_by !== user.id || Date.now() - new Date(performance.updated_at).getTime() > 5 * 60 * 1000) return json({ sent: 0 });
      const metrics = Array.isArray(performance.metrics) ? performance.metrics as { label?: string; value?: string; unit?: string }[] : [];
      const summary = metrics.slice(0, 3).map(item => `${item.label ?? ''} ${item.value ?? ''}${item.unit ? ` ${item.unit}` : ''}`.trim()).join(' · ');
      const what = row.kind === 'competition' ? 'résultat' : 'performance';
      const url = row.kind === 'competition' ? `${appUrl}/competitions` : `${appUrl}/plans`;
      if (athlete.user_id === user.id) {
        const { data: coaches } = await admin.from('shared_group_members').select('user_id').eq('group_id', row.group_id).eq('role', 'coach');
        const sent = await sendTo(admin, (coaches ?? []).map(item => item.user_id).filter(id => id !== user.id), {
          title: `${athlete.name} · nouveau ${what}`, body: short(`${row.title}${summary ? ` — ${summary}` : ''}`), url, tag: `result-${row.id}-${athlete.id}`,
        });
        return json({ sent });
      }
      if (athlete.user_id && await isCoach(admin, row.group_id, user.id)) {
        const coach = await displayName(admin, row.group_id, user.id, fallbackName);
        const sent = await sendTo(admin, [athlete.user_id], {
          title: `${coach} a enregistré ton ${what}`, body: short(`${row.title}${summary ? ` — ${summary}` : ''}`), url, tag: `result-${row.id}-${athlete.id}`,
        });
        return json({ sent });
      }
      return json({ sent: 0 });
    }

    // ── New group message (default) ──────────────────────────────────────────────────────
    const messageId = body.messageId;
    if (!isId(messageId)) return json({ error: 'Message invalide.' }, 400);
    const { data: message } = await admin.from('group_messages').select('*').eq('id', messageId).maybeSingle();
    if (!message || message.sender_id !== user.id) return json({ error: 'Accès refusé.' }, 403);
    if (Date.now() - new Date(message.created_at).getTime() > 5 * 60 * 1000) return json({ sent: 0 });
    const [{ data: group }, { data: members }, { data: blocks }] = await Promise.all([
      admin.from('shared_groups').select('name').eq('id', message.group_id).maybeSingle(),
      admin.from('shared_group_members').select('user_id').eq('group_id', message.group_id),
      admin.from('user_blocks').select('blocker_id').eq('blocked_id', user.id),
    ]);
    const blockedBy = new Set((blocks ?? []).map(row => row.blocker_id));
    const sent = await sendTo(admin, (members ?? []).map(row => row.user_id).filter(id => id !== user.id && !blockedBy.has(id)), {
      title: `${message.sender_name || 'Nouveau message'} · ${group?.name ?? 'Appletics'}`,
      body: short(message.body || (message.attachment_type?.startsWith('image/') ? '📷 Photo' : `📎 ${message.attachment_name || 'Fichier'}`)),
      url: `${appUrl}/group-chat?id=${message.group_id}`,
      tag: `group-${message.group_id}`,
    });
    return json({ sent });
  } catch (error) {
    console.error('[appletics-notify]', error instanceof Error ? error.message : error);
    return json({ error: 'Notification non envoyée.' }, 500);
  }
});
