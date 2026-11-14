import { getSupabaseClient } from '@/template';
import type { SubscriptionTier } from '@/constants/subscription';

export interface ClubPlan { tier: SubscriptionTier | null; club: string; groupId: string; leftAt: string | null }
export const noClubPlan: ClubPlan = { tier: null, club: '', groupId: '', leftAt: null };

// Level a coach gets from the club plan (Club Pro includes the PDF export and charts of the Elite coach plan).
export const coachTierForClub: Record<string, SubscriptionTier> = { club_basic: 'pro', club_pro: 'elite', club_elite: 'elite' };

export async function fetchClubPlan(): Promise<ClubPlan> {
  const { data, error } = await getSupabaseClient().rpc('appletics_club_plan');
  if (error || !data) return noClubPlan; // older server (SQL n° 18 not run yet): no club link
  const value = data as { tier?: string | null; club?: string; group_id?: string; left_at?: string | null };
  return { tier: (value.tier as SubscriptionTier) ?? null, club: value.club ?? '', groupId: value.group_id ?? '', leftAt: value.left_at ?? null };
}

export async function leaveClub(): Promise<void> {
  const { error } = await getSupabaseClient().rpc('appletics_leave_club');
  if (error) throw new Error(/function|schema cache/i.test(error.message) ? 'Mettez à jour la base Supabase (fichier SQL n° 18).' : error.message);
}

export async function markClubStaffGroup(groupId: string): Promise<void> {
  await getSupabaseClient().rpc('appletics_mark_club_staff', { p_group: groupId });
}
