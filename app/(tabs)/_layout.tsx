// Powered by OnSpace.AI
// Tab layout v2 — floating pill nav on phone, sidebar on tablet/desktop
import React, { useRef } from 'react';
import { Animated, Pressable, View, StyleSheet, Dimensions } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { useResponsive } from '@/hooks/useResponsive';
import { useApp } from '@/hooks/useApp';
import { CompactTabBar } from '@/components/layout/CompactTabBar';
import { useCoachCloudSync } from '@/hooks/useCoachCloudSync';
import { useAthleteCloudSync } from '@/hooks/useAthleteCloudSync';
import { useUnreadWatcher } from '@/hooks/useUnreadWatcher';
import { useAvatarSync } from '@/hooks/useAvatarSync';
import { useLogoutConfirm } from '@/hooks/useLogoutConfirm';
import { AvatarPhoto } from '@/components/ui/AvatarPhoto';
import { useUnreadCounts, unreadTotal } from '@/services/unreadStore';
import { LinearGradient } from 'expo-linear-gradient';

// ── Animated icon for phone pill nav ──────────────────────────────────────
function AnimatedTabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.22 : 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  }, [focused]);
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <MaterialIcons name={name as any} size={22} color={color} />
    </Animated.View>
  );
}

// ── Sidebar for tablet/desktop ─────────────────────────────────────────────
const NAV_ITEMS = [
  { name: 'index',        icon: 'home',         labelKey: 'nav_home' },
  { name: 'plans',        icon: 'event-note',   labelKey: 'nav_plans' },
  { name: 'competitions', icon: 'emoji-events', labelKey: 'competitions' },
  { name: 'chat',         icon: 'chat',         labelKey: 'nav_chat' },
  { name: 'profile',      icon: 'person',       labelKey: 'nav_profile' },
] as const;

function Sidebar() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useApp();
  const { isDesktop } = useResponsive();

  const logout = useLogoutConfirm();
  const activeTab = segments[1] as string || 'index';
  const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    // Orange like the logo, fading to white at the top so the logo stays visible.
    <LinearGradient colors={['#FFFFFF', '#FF7A4D', '#FF5722', '#E2461A']} locations={[0, 0.11, 0.45, 1]} style={[
      sideStyles.sidebar,
      { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) },
      isDesktop ? sideStyles.sidebarWide : sideStyles.sidebarNarrow,
    ]}>
      {/* Logo / Brand */}
      <View style={sideStyles.brand}>
        <Image source={require('@/assets/images/appletics-icon.png')} contentFit="contain" transition={200} style={sideStyles.brandLogo} />
        {isDesktop ? <Text style={sideStyles.brandText}>Appletics</Text> : null}
      </View>

      <View style={sideStyles.divider} />

      {/* Nav items */}
      <View style={sideStyles.navList}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.name || (item.name === 'index' && !activeTab);
          return (
            <Pressable
              key={item.name}
              style={({ pressed }) => [
                sideStyles.navItem,
                isActive && sideStyles.navItemActive,
                pressed && { opacity: 0.8 },
                isDesktop ? sideStyles.navItemWide : sideStyles.navItemNarrow,
              ]}
              onPress={() => router.push(`/(tabs)/${item.name === 'index' ? '' : item.name}` as any)}
            >
              <MaterialIcons
                name={item.icon as any}
                size={22}
                color={isActive ? Colors.primary : '#FFFFFF'}
              />
              {isDesktop ? (
                <Text style={[sideStyles.navLabel, isActive && sideStyles.navLabelActive]}>
                  {t(item.labelKey as any)}
                </Text>
              ) : null}
              {isActive && isDesktop ? <View style={sideStyles.activeIndicator} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* User avatar at bottom */}
      <Pressable
        style={({ pressed }) => [sideStyles.userAvatar, pressed && { opacity: 0.8 }]}
        onPress={() => router.push('/(tabs)/profile' as any)}
      >
        <View style={sideStyles.avatarCircle}>
          <Text style={sideStyles.avatarText}>{initials}</Text>
          <AvatarPhoto uri={user.avatar} />
        </View>
        {isDesktop ? (
          <View style={sideStyles.userInfo}>
            <Text verbatim style={sideStyles.userName} numberOfLines={1}>{user.name}</Text>
            <Text style={sideStyles.userRole}>{user.userType === 'athlete' ? 'Athlète' : 'Coach'}</Text>
          </View>
        ) : null}
        {isDesktop ? <Pressable accessibilityRole="button" accessibilityLabel="Se déconnecter" onPress={logout} style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' }, pressed && { opacity: 0.7 }]}>
          <MaterialIcons name="logout" size={20} color="#FFFFFF" />
        </Pressable> : null}
      </Pressable>
    </LinearGradient>
  );
}

const sideStyles = StyleSheet.create({
  sidebar: {
    borderRightWidth: 0,
    alignItems: 'stretch',
    gap: 0,
  },
  sidebarWide: { width: 220 },
  sidebarNarrow: { width: 68, alignItems: 'center' },
  brand: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  brandLogo: { width: 38, height: 38, borderRadius: Radius.md },
  brandIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  brandText: {
    fontSize: Typography.fontSizeMD, fontWeight: Typography.weightExtrabold,
    color: Colors.textPrimary,
  },
  divider: { height: 1, backgroundColor: 'rgba(255,87,34,0.18)', marginBottom: 12, marginHorizontal: 14 },
  navList: { gap: 2, paddingHorizontal: 8 },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: Radius.md, position: 'relative',
  },
  navItemWide: { paddingHorizontal: 12, paddingVertical: 11 },
  navItemNarrow: {
    paddingHorizontal: 0, paddingVertical: 11, justifyContent: 'center',
    width: 48, alignSelf: 'center',
  },
  navItemActive: { backgroundColor: '#FFFFFF' },
  navLabel: {
    fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold,
    color: '#FFFFFF', flex: 1,
  },
  navLabelActive: { color: Colors.primary, fontWeight: Typography.weightBold },
  activeIndicator: {
    position: 'absolute', right: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2, backgroundColor: Colors.primary,
  },
  userAvatar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)', marginTop: 8,
  },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: '#FFFFFF' },
  userRole: { fontSize: Typography.fontSizeXS, color: 'rgba(255,255,255,0.8)' },
});

// ── Layout wrapper for tablet/desktop ─────────────────────────────────────
function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const { isPhone, isDesktop } = useResponsive();
  if (isPhone) return <>{children}</>;
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: Colors.background }}>
      <Sidebar />
      {/* On a computer, tab pages keep a readable width next to the sidebar. */}
      <View style={{ flex: 1, alignItems: 'center' }}><View style={{ flex: 1, width: '100%', maxWidth: isDesktop ? 1680 : undefined }}>{children}</View></View>
    </View>
  );
}

// ── Root tab layout ────────────────────────────────────────────────────────
export default function TabLayout() {
  useCoachCloudSync();
  useAthleteCloudSync();
  useUnreadWatcher();
  useAvatarSync();
  const unread = unreadTotal(useUnreadCounts());
  const { t } = useI18n();

  return (
    <ResponsiveLayout>
    <Tabs tabBar={props => <CompactTabBar {...props} />} screenOptions={{ headerShown: false }}> 
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav_home'),
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: t('nav_plans'),
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon name="event-note" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="competitions"
        options={{
          title: t('competitions'),
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon name="emoji-events" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('nav_chat'),
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon name="chat" color={color} focused={focused} />,
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav_profile'),
          tabBarIcon: ({ color, focused }) => <AnimatedTabIcon name="person" color={color} focused={focused} />,
        }}
      />
    </Tabs>
    </ResponsiveLayout>
  );
}
