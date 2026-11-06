import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { getHigherPlan } from '@/services/subscriptionNavigationService';

export function useHigherPlanNavigation() {
  const router = useRouter();
  const { subscription, user } = useApp();
  const next = getHigherPlan(subscription, user.accountType === 'club' || Boolean(user.isClubAdmin));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef(false);
  const navigate = useCallback(() => {
    if (!next) return;
    router.push({ pathname: '/upgrade', params: { tier: next.id, track: next.track, focusId: String(Date.now()) } });
  }, [router, next]);
  const onModalDismiss = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    navigate();
  }, [navigate]);
  const openAfterClose = useCallback((close: () => void) => {
    if (pending.current || !next) return;
    pending.current = true;
    close();
    // Native iOS uses onDismiss; Android/web use a guarded fallback after the closing animation.
    timer.current = setTimeout(onModalDismiss, 300);
  }, [next, onModalDismiss]);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    pending.current = false;
  }, []);
  return { goToHigherPlan: navigate, openAfterClose, onModalDismiss, nextPlan: next };
}
