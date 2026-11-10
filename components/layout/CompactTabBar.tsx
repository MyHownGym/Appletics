import { memo, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView, Animated } from 'react-native';
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
  // Sliding glass indicator under the active tab (positions measured from each tab).
  const [layouts, setLayouts] = useState<Record<number, { x: number; width: number }>>({});
  const x = useRef(new Animated.Value(0)).current, w = useRef(new Animated.Value(0)).current;
  const ready = useRef(false);
  const active = layouts[state.index];
  useEffect(() => {
    if (!active) return;
    if (!ready.current) { x.setValue(active.x); w.setValue(active.width); ready.current = true; return; }
    Animated.parallel([
      Animated.spring(x, { toValue: active.x, useNativeDriver: false, speed: 18, bounciness: 7 }),
      Animated.spring(w, { toValue: active.width, useNativeDriver: false, speed: 18, bounciness: 7 }),
    ]).start();
  }, [active?.x, active?.width]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!isPhone) return null;
  return (
    <View pointerEvents="box-none" style={[styles.dock, {
      height: Platform.select({ ios: insets.bottom + 80, android: insets.bottom + 80, default: 80 }),
      paddingBottom: Platform.select({ ios: insets.bottom + 8, android: insets.bottom + 8, default: 8 }),
    }]}>
      {/* Frosted orange glass (like iOS / WhatsApp): the page shows through, blurred. */}
      <View style={[styles.pill, Shadow.tabBar, glass]}>
        <LinearGradient pointerEvents="none" colors={['rgba(214,62,18,0.78)', 'rgba(255,87,34,0.70)', 'rgba(255,148,112,0.66)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.6 }} style={StyleSheet.absoluteFill} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.items}>
          {active ? <Animated.View pointerEvents="none" style={[styles.indicator, glassLight, { left: x, width: w }]} /> : null}
          {state.routes.map((route, index) => {
            const options = descriptors[route.key].options;
            const focused = state.index === index;
            const color = focused ? Colors.primary : '#FFFFFF';
            const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title || route.name;
            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            };
            return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={options.tabBarAccessibilityLabel || label} onPress={onPress} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} onLayout={event => { const { x: left, width } = event.nativeEvent.layout; setLayouts(previous => (previous[index]?.x === left && previous[index]?.width === width ? previous : { ...previous, [index]: { x: left, width } })); }} style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}>
              <View>
                <MaterialIcons name={(icons[route.name] || 'circle') as any} size={22} color={color} />
                {options.tabBarBadge != null ? <View style={styles.badge}><Text style={styles.badgeText}>{String(options.tabBarBadge)}</Text></View> : null}
              </View>
              <Text style={[styles.label, { color }]}>{label}</Text>
            </Pressable>;
          })}
        </ScrollView>
      </View>
    </View>
  );
});
// Backdrop blur exists on the web (and iOS Safari); native falls back to the translucent colours.
const glass = (Platform.OS === 'web' ? { backdropFilter: 'blur(22px) saturate(180%)', WebkitBackdropFilter: 'blur(22px) saturate(180%)' } : {}) as object;
const glassLight = (Platform.OS === 'web' ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : {}) as object;
const styles = StyleSheet.create({
  indicator: { position: 'absolute', top: 6, height: 52, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', shadowColor: '#7A1F00', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  dock: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 8, paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'flex-start' },
  pill: { width: '100%', maxWidth: 480, height: 64, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', overflow: 'hidden' },
  items: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 6, gap: 2, position: 'relative' },
  // Intrinsic item widths preserve complete labels; horizontal scrolling is only needed for large accessibility text.
  item: { flexGrow: 1, flexShrink: 0, minWidth: 48, height: 52, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  // Active tab: a white pill inset inside the bar (same rounding, small margin all around).
  selected: { backgroundColor: '#FFFFFF', shadowColor: '#7A1F00', shadowOpacity: 0.22, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  label: { fontSize: Typography.fontSizeXS, lineHeight: 14, fontWeight: Typography.weightSemibold, textAlign: 'center', includeFontPadding: false },
  pressed: { opacity: 0.65 },
  // Unread messages
  badge: { position: 'absolute', top: -6, right: -10, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontSize: 10, lineHeight: 12, fontWeight: '800', includeFontPadding: false },
});
