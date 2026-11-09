import { memo } from 'react';
import { View, FlatList, Pressable, Text, StyleSheet } from 'react-native';
import { EVENT_GROUPS } from '@/constants/config';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useI18n } from '@/hooks/useI18n';
import { disciplineLabel, disciplineOf } from '@/services/trainingGroups';

interface DisciplineChipsProps {
  value: string;
  onChange: (discipline: string) => void;
  disabled?: boolean;
}

export const DisciplineChips = memo(function DisciplineChips({ value, onChange, disabled = false }: DisciplineChipsProps) {
  const { language } = useI18n();
  const selectedId = disciplineOf({ discipline: value });

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={EVENT_GROUPS}
        extraData={`${selectedId}:${language}:${disabled}`}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          const label = disciplineLabel(item.id, language);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected, disabled }}
              disabled={disabled}
              onPress={() => onChange(item.id)}
              style={({ pressed }) => [styles.chip, isSelected ? styles.selected : null, disabled ? styles.disabled : null, pressed ? styles.pressed : null]}
            >
              <Text style={[styles.label, isSelected ? styles.selectedLabel : null]}>{label}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { minHeight: 48 + Spacing.sm * 2, paddingVertical: Spacing.sm },
  content: { alignItems: 'center', gap: Spacing.sm },
  chip: { minHeight: 48, paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  selected: { borderColor: Colors.clubDeep, backgroundColor: Colors.clubDeep },
  label: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, includeFontPadding: false },
  selectedLabel: { color: Colors.textOnPrimary },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});
