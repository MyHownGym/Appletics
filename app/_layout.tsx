// Powered by OnSpace.AI
// Root layout v14 — deep linking from notifications, push notification listener
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { AlertProvider, AuthProvider, useAuth } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';
import { BillingProvider } from '@/contexts/BillingContext';
import { SharedGroupsProvider } from '@/contexts/SharedGroupsContext';
import { ClubCoachesProvider } from '@/contexts/ClubCoachesContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { StartupProvider } from '@/contexts/StartupContext';
import { useStartup } from '@/hooks/useStartup';
import { useStartupProgress } from '@/hooks/useStartupProgress';
import { useAuthStartup } from '@/hooks/useAuthStartup';
import { StartupOverlay } from '@/components/feature/StartupOverlay';
import { StatusBar } from 'expo-status-bar';
import { useApp } from '@/hooks/useApp';
import { Colors } from '@/constants/theme';
import * as Notifications from 'expo-notifications';
import { getDeepLinkRoute, NotificationPayload } from '@/hooks/usePushNotifications';

// ── Navigation guard ─────────────────────────────────────────────────────────

function NavigationGuard() {
  const { onboardingDone, onboardingLoading, accountProfileLoading, startupError, isLocked } = useApp();
  const auth = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (onboardingLoading || accountProfileLoading || auth.loading || startupError) return;

    const inOnboarding = segments[0] === 'onboarding' || segments[0] === 'club-onboarding';
    const inLogin = segments[0] === 'login';

    if (!onboardingDone && inLogin && !!auth.user && !isLocked) {
      // Signed in from "J'ai déjà un compte" but this account has no Appletics profile yet: finish the profile.
      hasNavigated.current = false;
      router.replace('/onboarding');
    } else if (!onboardingDone && !inOnboarding && !inLogin) {
      // The login screen stays reachable before onboarding, for people who already have an account.
      hasNavigated.current = false;
      router.replace('/onboarding');
    } else if (onboardingDone && (isLocked || !auth.user) && !inLogin && !inOnboarding) {
      hasNavigated.current = false;
      router.replace('/login');
    } else if (onboardingDone && !isLocked && !!auth.user && (inLogin || inOnboarding)) {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        router.replace('/(tabs)');
      }
    }
  }, [onboardingLoading, accountProfileLoading, startupError, onboardingDone, isLocked, auth.loading, auth.user?.id, segments[0], router]);

  return null;
}

// ── Notification deep link handler ───────────────────────────────────────────

function NotificationHandler() {
  const router = useRouter();
  const { isLocked, onboardingDone } = useApp();

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    // Handle taps on notifications when app is already open (foreground/background)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as NotificationPayload;
      if (!data?.type) return;
      if (!onboardingDone || isLocked) return; // don't navigate if locked

      const route = getDeepLinkRoute(data);
      if (!route) return;

      // Small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        timers.delete(timer);
        try {
          if (route.includes('?')) {
            const [path, query] = route.split('?');
            const params: Record<string, string> = {};
            query.split('&').forEach(pair => {
              const [k, v] = pair.split('=');
              params[k] = decodeURIComponent(v || '');
            });
            router.push({ pathname: path as any, params });
          } else {
            router.push(route as any);
          }
        } catch (e) {
          // Navigation failed — stay on current screen
        }
      }, 300);
      timers.add(timer);
    });

    return () => { subscription.remove(); timers.forEach(clearTimeout); timers.clear(); };
  }, [isLocked, onboardingDone]);

  return null;
}

// ── App content ──────────────────────────────────────────────────────────────

// Screens opened on top of the tabs (detail pages, forms, group chat) stay readable on a computer:
// centered column instead of stretching across the whole window.
const FULL_WIDTH_ROUTES = new Set(['(tabs)', 'index', 'login', 'onboarding']);

function AppContent() {
  useStartupProgress();
  const { width } = useWindowDimensions();
  const wide = width >= 1024;

  return (
    <>
      <Stack screenOptions={({ route }) => ({
        headerShown: false,
        ...(wide && !FULL_WIDTH_ROUTES.has(route.name) ? {
          contentStyle: { width: '100%', maxWidth: 1120, alignSelf: 'center', backgroundColor: Colors.background, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
        } : {}),
      })}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="browser" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="coach-detail" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="athlete-add" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="athlete-detail" options={{ headerShown: false }} />
        <Stack.Screen name="plan-create" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="plan-detail" options={{ headerShown: false }} />
        <Stack.Screen name="session-edit" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="competition-create" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="competition-detail" options={{ headerShown: false }} />
        <Stack.Screen name="create-channel" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="chat-room" options={{ headerShown: false }} />
        <Stack.Screen name="group-chat" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="upgrade" options={{ headerShown: false }} />
        <Stack.Screen name="shared-groups" options={{ headerShown: false }} />
        <Stack.Screen name="shared-group" options={{ headerShown: false }} />
        <Stack.Screen name="import-results" options={{ headerShown: false }} />
        <Stack.Screen name="billing-return" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="club-onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="club-admin" options={{ headerShown: false }} />
      </Stack>

      <NavigationGuard />
      <NotificationHandler />

    </>
  );
}

function StartupSession() {
  const { attempt } = useStartup();
  const { prepared } = useAuthStartup();
  return <View style={styles.shell}>
    {/* An explicit startup retry remounts providers; it never clears the persisted session or sports data. */}
    <View key={attempt} style={styles.shell}>
      {/* Install lock-safe session notifications before mounting the existing auth provider. */}
      {prepared ? <AuthProvider>
        <BillingProvider>
          <AppProvider>
            <SharedGroupsProvider>
              <ClubCoachesProvider>
                <StatusBar style="dark" />
                <AppContent />
              </ClubCoachesProvider>
            </SharedGroupsProvider>
          </AppProvider>
        </BillingProvider>
      </AuthProvider> : null}
    </View>
    {/* Outside AuthProvider: remains visible and actionable even when its initialization is pending. */}
    <StartupOverlay />
  </View>;
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <I18nProvider>
          <StartupProvider>
            <StartupSession />
          </StartupProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: Colors.surface },
});
