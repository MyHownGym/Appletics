import { useEffect } from 'react';
import { useClubCoaches } from '@/hooks/useClubCoaches';
import { useSharedGroups } from '@/hooks/useSharedGroups';

// A coach invited by e-mail shows « Actif » as soon as they accepted the club's invitation.
export function useClubCoachStatusSync() {
  const { coaches, updateCoachStatus } = useClubCoaches();
  const shared = useSharedGroups();
  useEffect(() => { void shared.refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const accepted = new Set(shared.data.invitations
      .filter(invitation => invitation.role === 'coach' && invitation.status === 'accepted')
      .map(invitation => invitation.email.trim().toLowerCase()));
    for (const coach of coaches) {
      if (coach.status === 'pending' && accepted.has(coach.email.trim().toLowerCase())) updateCoachStatus(coach.id, 'active');
    }
  }, [shared.data.invitations, coaches, updateCoachStatus]);
}
