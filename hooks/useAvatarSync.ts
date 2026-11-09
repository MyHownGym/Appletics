import { useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useSharedGroups } from '@/hooks/useSharedGroups';

// The profile photo follows the account into its groups: coaches see their athletes' photos (and vice versa).
export function useAvatarSync() {
  const { user } = useApp();
  const shared = useSharedGroups();
  const uid = shared.userId ?? '';
  const sending = useRef('');
  const avatar = user.avatar && /^(data:image\/(jpeg|png|webp);base64,|https:\/\/)/.test(user.avatar) && user.avatar.length <= 400000 ? user.avatar : null;
  const mine = shared.data.members.filter(item => item.user_id === uid);
  const outdated = mine.some(item => (item.avatar ?? null) !== avatar);
  useEffect(() => {
    if (!uid || !mine.length || !outdated || sending.current === (avatar ?? '∅')) return;
    sending.current = avatar ?? '∅';
    void (async () => {
      const { error } = await getSupabaseClient().rpc('appletics_set_member_avatar', { p_avatar: avatar });
      if (error) { sending.current = ''; return; }
      void shared.refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, avatar, outdated, mine.length]);
}
