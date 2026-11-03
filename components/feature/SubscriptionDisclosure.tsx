import { memo, useCallback, useState, type ReactNode } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';

interface SubscriptionDisclosureProps { title: string; children: ReactNode }
// Local visual state only; the billing/account state remains in shared providers.
export const SubscriptionDisclosure = memo(function SubscriptionDisclosure({ title, children }: SubscriptionDisclosureProps) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(value => !value), []);
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={toggle} style={({ pressed }) => [styles.header, pressed ? styles.pressed : null]}><Text style={styles.title}>{title}</Text><MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color={Colors.textSecondary} /></Pressable>
    {expanded ? <View style={styles.content}>{children}</View> : null}
  </View>;
});
const styles = StyleSheet.create({
  container: { borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, minHeight: 56 }, title: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary },
  content: { gap: Spacing.md, padding: Spacing.sm, borderTopColor: Colors.border, borderTopWidth: 1 }, pressed: { opacity: 0.7 },
});
