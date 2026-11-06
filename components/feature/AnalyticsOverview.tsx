import { memo, useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useAnalyticsGrid } from '@/hooks/useAnalyticsGrid';
import type { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';

interface AnalyticsOverviewProps { stats: ReturnType<typeof useAdvancedAnalytics> }
export const AnalyticsOverview = memo(function AnalyticsOverview({ stats }: AnalyticsOverviewProps) {
  const grid = useAnalyticsGrid();
  const metrics = useMemo(() => [
    { id: 'athletes', icon: 'people', label: 'Athlètes actifs', value: String(stats.activeAthletes), sub: `${stats.totalAthletes} au total`, color: Colors.success },
    { id: 'availability', icon: 'health-and-safety', label: 'Disponibilité', value: `${stats.availabilityRate}%`, sub: `${stats.injuredAthletes} blessé(s) · ${stats.inactiveAthletes} inactif(s)`, color: stats.availabilityRate > 90 ? Colors.success : Colors.warning },
    { id: 'plans', icon: 'event-note', label: 'Plans actifs', value: String(stats.activePlans), sub: 'à la date du jour', color: Colors.primary },
    { id: 'competitions', icon: 'emoji-events', label: 'Compétitions', value: String(stats.upcomingComps), sub: 'à venir', color: Colors.warning },
    { id: 'pbs', icon: 'star', label: 'Records (PBs)', value: String(stats.totalPBs), sub: `${stats.pbRate}% des résultats`, color: Colors.warning },
    { id: 'wins', icon: 'emoji-events', label: 'Victoires', value: String(stats.totalVictories), sub: 'toutes épreuves', color: Colors.success },
    { id: 'results', icon: 'bar-chart', label: 'Résultats', value: String(stats.totalResults), sub: 'enregistrés', color: Colors.primary },
    { id: 'groups', icon: 'group', label: 'Groupes actifs', value: String(stats.groupData.length), sub: 'disciplines', color: Colors.info },
  ], [stats]);
  return (
    <View style={styles.grid} onLayout={event => grid.onWidthChange(event.nativeEvent.layout.width)}>
      <FlatList
        key={`overview-${grid.columns}`}
        data={metrics}
        keyExtractor={item => item.id}
        numColumns={grid.columns}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        extraData={grid.cardWidth}
        columnWrapperStyle={grid.columns > 1 ? styles.row : undefined}
        renderItem={({ item }) => (
          <View style={[styles.card, Shadow.card, { width: grid.cardWidth }]}>
            <View style={[styles.icon, { backgroundColor: item.color + '12' }]}><MaterialIcons name={item.icon as any} size={24} color={item.color} /></View>
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.sub}>{item.sub}</Text>
          </View>
        )}
      />
    </View>
  );
});
const styles = StyleSheet.create({
  grid: { width: '100%' },
  row: { gap: Spacing.sm, alignItems: 'stretch' },
  card: { minHeight: 192, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', gap: Spacing.sm },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: Typography.fontSizeXXL, color: Colors.textPrimary, fontWeight: Typography.weightBold, textAlign: 'center', includeFontPadding: false },
  label: { width: '100%', fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textPrimary, fontWeight: Typography.weightSemibold, textAlign: 'center', includeFontPadding: false },
  sub: { width: '100%', fontSize: Typography.fontSizeBase, lineHeight: 26, color: Colors.textSecondary, textAlign: 'center', includeFontPadding: false },
});
