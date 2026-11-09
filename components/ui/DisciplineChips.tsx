import { View, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { Colors, Radius, Typography } from '@/constants/theme';
import { DISCIPLINES } from '@/services/trainingGroups';

// Discipline picker for a training group (Tous, Sprint, Demi-fond…).
export function DisciplineChips({ value, onChange, includeAll = true }: { value: string; onChange: (id: string) => void; includeAll?: boolean }) {
  return <View style={styles.row}>
    {DISCIPLINES.filter(item => includeAll || item.id !== 'all').map(item => {
      const selected = value === item.id;
      return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => onChange(item.id)}
        style={({ pressed }) => [styles.chip, selected ? { backgroundColor: item.color, borderColor: item.color } : null, pressed ? styles.pressed : null]}>
        <Text style={[styles.label, selected ? styles.labelSelected : null]}>{item.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center', borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.textSecondary },
  labelSelected: { color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
});
