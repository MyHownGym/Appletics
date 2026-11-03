import { memo, useMemo } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface AthleteSeasonFilterProps {
  years: number[];
  selectedYear: number | null;
  onSelect: (year: number | null) => void;
  resultCount: number;
  accentColor: string;
}

export const AthleteSeasonFilter = memo(function AthleteSeasonFilter({ years, selectedYear, onSelect, resultCount, accentColor }: AthleteSeasonFilterProps) {
  const options = useMemo(() => [{ id: 'all', year: null as number | null, label: 'Toutes' },
    ...years.map(year => ({ id: String(year), year, label: String(year) }))], [years]);
  const scope = selectedYear === null ? 'Toutes les saisons' : `Saison ${selectedYear}`;
  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <MaterialIcons name="event" size={20} color={accentColor} />
        <Text style={styles.title}>Saison</Text>
      </View>
      <View style={styles.rail}>
        <FlatList
          horizontal
          data={options}
          extraData={selectedYear}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.options}
          renderItem={({ item }) => {
            const isSelected = item.year === selectedYear;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.year === null ? 'Afficher toutes les saisons' : `Afficher la saison ${item.year}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(item.year)}
                style={({ pressed }) => [styles.chip, isSelected ? { backgroundColor: accentColor, borderColor: accentColor } : null, pressed ? styles.pressed : null]}
              >
                <Text style={[styles.chipLabel, isSelected ? styles.selectedLabel : null]}>{item.label}</Text>
              </Pressable>
            );
          }}
        />
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.summary}>{scope} · {resultCount} résultat{resultCount !== 1 ? 's' : ''}</Text>
      <Text style={styles.hint}>Année de la compétition · graphique et compteurs filtrés.</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, gap: Spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, includeFontPadding: false },
  rail: { minHeight: Spacing.xxl },
  options: { alignItems: 'center', gap: Spacing.sm },
  chip: { height: Spacing.xxl, minWidth: 72, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textSecondary, includeFontPadding: false },
  selectedLabel: { color: Colors.textOnPrimary },
  summary: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary, lineHeight: 26, includeFontPadding: false },
  hint: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 26, includeFontPadding: false },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
