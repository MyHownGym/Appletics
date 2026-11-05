import { Redirect } from 'expo-router';
import { useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
import { StartupLoadingScreen } from '@/components/feature/StartupOverlay';

// Entry route. Navigation to onboarding / login is decided only by NavigationGuard in app/_layout.tsx.
// This screen no longer pushes to /login itself: doing both caused an endless /login <-> /onboarding
// redirect loop ("Maximum update depth exceeded") for every signed-out or new user.
export default function IndexScreen() {
  const auth = useAuth();
  const { onboardingDone, onboardingLoading, accountProfileLoading, startupError, isLocked } = useApp();
  const ready = !auth.loading && !onboardingLoading && !accountProfileLoading && !startupError;
  if (ready && onboardingDone && !isLocked && auth.user) return <Redirect href="/(tabs)" />;
  return <StartupLoadingScreen />;
}