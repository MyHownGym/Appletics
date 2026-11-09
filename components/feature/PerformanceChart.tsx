import { memo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Platform } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useI18n } from '@/hooks/useI18n';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { Competition, CompResult } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { usePerformanceChart } from '@/hooks/usePerformanceChart';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionFeatureGate } from '@/components/feature/SubscriptionFeatureGate';

const AXIS_FONT = Platform.OS === 'web' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' : undefined;

interface PerformanceChartProps {
  results: CompResult[];
  event: string;
  accentColor: string;
  competitions: Competition[];
}

export const PerformanceChart = memo(function PerformanceChart({ results, event, accentColor, competitions }: PerformanceChartProps) {
  const chart = usePerformanceChart(results, event, competitions);
  const { t, locale } = useI18n();
  const { hasFeature } = useSubscription();
  if (!hasFeature('performance_charts')) return <SubscriptionFeatureGate feature="performance_charts" title="Graphiques de performance" />;
  return (
    <View style={styles.container} onLayout={layout => chart.onWidthChange(layout.nativeEvent.layout.width)}>
      {chart.points.length < 2 ? (
        <View style={styles.empty}>
          <MaterialIcons name="show-chart" size={24} color={Colors.textSecondary} />
          <Text style={styles.body}>{chart.points.length ? 'Au moins 2 résultats nécessaires pour le graphique' : 'Aucun résultat numérique pour cette épreuve'}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.axisHint}>{chart.isDistance ? 'Performance · valeurs croissantes vers le haut' : 'Chrono · temps les plus petits en bas'}</Text>
          <View style={styles.chartViewport}>
            <ScrollView horizontal showsHorizontalScrollIndicator={chart.width > 350} contentContainerStyle={styles.chartScroll}>
              <View style={{ width: chart.width, height: 216 }}>
                <Svg width={chart.width} height={216}>
                  {chart.ticks.map((tick, index) => (
                    <Line key={`grid-${index}`} x1={chart.plotLeft} x2={chart.plotRight} y1={tick.y} y2={tick.y} stroke={Colors.border} strokeWidth={1} />
                  ))}
                  {chart.ticks.map((tick, index) => (
                    <SvgText key={`label-${index}`} x={chart.plotLeft - 12} y={tick.y + 4} textAnchor="end" fill={Colors.textPrimary} fontSize={Typography.fontSizeXS} fontWeight="700" fontFamily={AXIS_FONT}>{tick.label}</SvgText>
                  ))}
                  {chart.ticks.length ? <>
                    <Line x1={chart.plotLeft} x2={chart.plotLeft} y1={Math.min(...chart.ticks.map(tick => tick.y))} y2={Math.max(...chart.ticks.map(tick => tick.y))} stroke={Colors.textPrimary} strokeWidth={2} />
                    <Line x1={chart.plotLeft} x2={chart.plotRight} y1={Math.max(...chart.ticks.map(tick => tick.y))} y2={Math.max(...chart.ticks.map(tick => tick.y))} stroke={Colors.textPrimary} strokeWidth={2} />
                  </> : null}
                  {chart.points.slice(0, -1).map((point, index) => {
                    const next = chart.points[index + 1];
                    const better = chart.isDistance ? next.value > point.value : next.value < point.value;
                    const same = next.value === point.value;
                    return <Line key={`segment-${point.result.id}`} x1={point.x} y1={point.y} x2={next.x} y2={next.y} stroke={same ? Colors.textSecondary : better ? Colors.success : Colors.error} strokeWidth={3} />;
                  })}
                  {chart.points.map(point => (
                    <Circle key={point.result.id} cx={point.x} cy={point.y} r={5} fill={point.result.pb ? Colors.warning : accentColor} stroke={Colors.surface} strokeWidth={2} />
                  ))}
                  <SvgText x={chart.plotLeft} y={206} textAnchor="start" fill={Colors.textPrimary} fontSize={Typography.fontSizeXS} fontWeight="700" fontFamily={AXIS_FONT}>{t('Résultat')} 1</SvgText>
                  <SvgText x={chart.plotRight} y={206} textAnchor="end" fill={Colors.textPrimary} fontSize={Typography.fontSizeXS} fontWeight="700" fontFamily={AXIS_FONT}>{t('Résultat')} {chart.points.length}</SvgText>
                </Svg>
                {chart.points.map((point, index) => (
                  <Pressable
                    key={`hit-${point.result.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Résultat ${index + 1} : ${point.result.result}${point.result.pb ? ', PB' : ''}`}
                    accessibilityState={{ selected: chart.selectedResult?.id === point.result.id }}
                    onPress={() => chart.selectResult(point.result.id)}
                    style={({ pressed }) => [styles.pointHit, { left: point.x - 24, top: point.y - 24 }, pressed ? styles.pressed : null]}
                  >
                    {chart.selectedResult?.id === point.result.id ? <View style={[styles.pointRing, { borderColor: accentColor }]} /> : null}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.success }]} /><Text style={styles.legendText}>Progression</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.error }]} /><Text style={styles.legendText}>Régression</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: Colors.warning }]} /><Text style={styles.legendText}>PB</Text></View>
          </View>
          {chart.selectedResult ? (
            <View style={styles.detail}>
              <Text style={[styles.performance, { color: accentColor }]}>{chart.selectedResult.result}{chart.selectedResult.pb ? ' · PB' : ''}</Text>
              <Text verbatim style={styles.body}>{chart.selectedCompetition?.name ?? t('Compétition')}{chart.selectedCompetition?.date ? ` · ${new Date(chart.selectedCompetition.date + 'T00:00:00').toLocaleDateString(locale)}` : ''}</Text>
            </View>
          ) : null}
          <Text style={styles.hint}>Touchez un point pour voir le résultat exact.</Text>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { width: '100%' },
  empty: { paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  axisHint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.sm },
  chartViewport: { height: 224 },
  chartScroll: { alignItems: 'center' },
  pointHit: { position: 'absolute', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.full },
  pointRing: { width: 20, height: 20, borderRadius: Radius.full, borderWidth: 2 },
  pressed: { opacity: 0.65, backgroundColor: Colors.primaryLight },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, paddingVertical: Spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  legendText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  detail: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.sm, gap: Spacing.xs },
  performance: { fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold },
  body: { fontSize: Typography.fontSizeBase, color: Colors.textSecondary, lineHeight: 26, textAlign: 'left' },
  hint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginTop: Spacing.sm },
});
