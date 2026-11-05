import { useCallback, useRef } from 'react';
import { ScrollView, LayoutChangeEvent } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Spacing } from '@/constants/theme';

export function useProfileSectionNavigation() {
  const params = useLocalSearchParams<{ section?: string; focusId?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});
  const focused = useRef(false);
  const handled = useRef('');
  const token = `${params.section || ''}:${params.focusId || ''}`;
  const scrollToSection = useCallback(() => {
    if (!focused.current || !params.section || handled.current === token) return;
    const y = positions.current[params.section];
    if (y === undefined || !scrollRef.current) return;
    scrollRef.current.scrollTo({ y: Math.max(0, y - Spacing.md), animated: true });
    handled.current = token;
  }, [params.section, token]);
  useFocusEffect(useCallback(() => {
    focused.current = true;
    const timer = setTimeout(scrollToSection, 250);
    return () => { focused.current = false; clearTimeout(timer); };
  }, [scrollToSection]));
  const onAthletesLayout = useCallback((event: LayoutChangeEvent) => {
    positions.current.athletes = event.nativeEvent.layout.y;
  }, []);
  return { scrollRef, onAthletesLayout, onContentSizeChange: scrollToSection };
}
