import { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAlert, useAuth } from '@/template';
import { ClubCoach, loadClubCoaches, saveClubCoaches } from '@/services/clubCoachService';

interface ClubCoachesContextType {
  coaches: ClubCoach[]; loading: boolean;
  addCoach: (coach: ClubCoach) => boolean;
  removeCoach: (id: string) => void;
  updateCoachStatus: (id: string, status: ClubCoach['status']) => void;
}
interface RosterState { scope: string; coaches: ClubCoach[]; ready: boolean; dirty: boolean }
export const ClubCoachesContext = createContext<ClubCoachesContextType | undefined>(undefined);

// Shared, persistent LOCAL roster; does not create server accounts or send invitations.
export function ClubCoachesProvider({ children }: { children: ReactNode }) {
  const { user, onboardingLoading, accountProfileLoading } = useApp();
  const auth = useAuth();
  const { showAlert } = useAlert();
  const scope = !onboardingLoading && !accountProfileLoading && auth.user?.id === user.id && user.accountType === 'club'
    ? `${user.id}:${user.clubId || user.club.trim().toLowerCase()}` : '';
  const [state, setState] = useState<RosterState>({ scope: '', coaches: [], ready: false, dirty: false });
  useEffect(() => {
    let cancelled = false;
    setState({ scope, coaches: [], ready: false, dirty: false });
    if (!scope) return () => { cancelled = true; };
    void loadClubCoaches(scope).then(coaches => {
      if (!cancelled) setState({ scope, coaches, ready: true, dirty: false });
    }).catch(() => {
      if (!cancelled) showAlert('Coachs du club', 'Impossible de charger la liste enregistrée sur cet appareil.');
    });
    return () => { cancelled = true; };
  }, [scope]);
  useEffect(() => {
    if (!state.scope || !state.ready || !state.dirty) return;
    void saveClubCoaches(state.scope, state.coaches).catch(() => showAlert('Sauvegarde locale', 'La liste des coachs reste visible, mais son enregistrement a échoué.'));
  }, [state]);
  const coaches = state.scope === scope && scope ? state.coaches : [];
  const loading = !!scope && (state.scope !== scope || !state.ready);
  const addCoach = useCallback((coach: ClubCoach) => {
    if (!scope || loading || coaches.some(item => item.email.toLowerCase() === coach.email.toLowerCase())) return false;
    setState(previous => previous.scope === scope && previous.ready
      ? { ...previous, coaches: [coach, ...previous.coaches], dirty: true } : previous);
    return true;
  }, [scope, loading, coaches]);
  const removeCoach = useCallback((id: string) => {
    setState(previous => previous.scope === scope && previous.ready
      ? { ...previous, coaches: previous.coaches.filter(coach => coach.id !== id), dirty: true } : previous);
  }, [scope]);
  const updateCoachStatus = useCallback((id: string, status: ClubCoach['status']) => {
    setState(previous => previous.scope === scope && previous.ready
      ? { ...previous, coaches: previous.coaches.map(coach => coach.id === id ? { ...coach, status } : coach), dirty: true } : previous);
  }, [scope]);
  const value = useMemo(() => ({ coaches, loading, addCoach, removeCoach, updateCoachStatus }), [coaches, loading, addCoach, removeCoach, updateCoachStatus]);
  return <ClubCoachesContext.Provider value={value}>{children}</ClubCoachesContext.Provider>;
}
