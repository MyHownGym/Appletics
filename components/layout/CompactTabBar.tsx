import { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks/useResponsive';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

const icons: Record<string, string> = { index: 'home', plans: 'event-note', competitions: 'emoji-events', chat: 'chat', profile: 'person' };
export const CompactTabBar = memo(function CompactTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isPhone } = useResponsive();
  if (!isPhone) return null;
  return (
    <View pointerEvents="box-none" style={[styles.dock, {
      height: Platform.select({ ios: insets.bottom + 80, android: insets.bottom + 80, default: 80 }),
      paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    }]}>
      {/* Orange like the logo and the desktop sidebar. */}
      <LinearGradient colors={['#D63E12', '#FF5722', '#FF9470']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.pill, Shadow.tabBar]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.items}>
          {state.routes.map((route, index) => {
            const options = descriptors[route.key].options;
            const focused = state.index === index;
            const color = focused ? Colors.primary : '#FFFFFF';
            const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title || route.name;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };
            return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={options.tabBarAccessibilityLabel || label} onPress={onPress} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} style={({ pressed }) => [styles.item, focused ? styles.selected : null, pressed ? styles.pressed : null]}>
              <View>
                <MaterialIcons name={(icons[route.name] || 'circle') as any} size={22} color={color} />
                {options.tabBarBadge != null ? <View style={styles.badge}><Text style={styles.badgeText}>{String(options.tabBarBadge)}</Text></View> : null}
              </View>
              <Text style={[styles.label, { color }]}>{label}</Text>
            </Pressable>;
          })}
        </ScrollView>
      </LinearGradient>
    </View>
  );
});
const styles = StyleSheet.create({
  dock: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 8, paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'flex-start' },
  pill: { width: '100%', maxWidth: 480, height: 64, borderRadius: Radius.full, borderWidth: 0, overflow: 'hidden' },
  items: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs },
  // Intrinsic item widths preserve complete labels; horizontal scrolling is only needed for large accessibility text.
  item: { flexGrow: 1, flexShrink: 0, minWidth: 48, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm, borderRadius: Radius.full },
  selected: { backgroundColor: '#FFFFFF' },
  label: { fontSize: Typography.fontSizeXS, lineHeight: 14, fontWeight: Typography.weightSemibold, textAlign: 'center', includeFontPadding: false },
  pressed: { opacity: 0.65 },
  // Unread messages
  badge: { position: 'absolute', top: -6, right: -10, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontSize: 10, lineHeight: 12, fontWeight: '800', includeFontPadding: false },
});
