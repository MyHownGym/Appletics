// Powered by OnSpace.AI
// Inline mini calendar picker — no external deps
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useI18n } from '@/hooks/useI18n';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function MiniCalendar({ value, onChange }: Props) {
  const { t, locale } = useI18n();
  const days = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'].map(t);
  const today = new Date();
  const initialDate = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const firstDay = new Date(viewYear, viewMonth, 1);
  // Monday-based: getDay() returns 0=Sun, 1=Mon...
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    cells.push(dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null);
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleSelect = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mm}-${dd}`);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day;
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable accessibilityLabel={t('Mois précédent')} onPress={prevMonth} style={({ pressed }) => [styles.navBtn, pressed ? { opacity: 0.7 } : null]} hitSlop={8}>
          <MaterialIcons name="chevron-left" size={22} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.monthYear}>{new Date(viewYear, viewMonth, 1).toLocaleDateString(locale, { month: 'long' })} {viewYear}</Text>
        <Pressable accessibilityLabel={t('Mois suivant')} onPress={nextMonth} style={({ pressed }) => [styles.navBtn, pressed ? { opacity: 0.7 } : null]} hitSlop={8}>
          <MaterialIcons name="chevron-right" size={22} color={Colors.textSecondary} />
        </Pressable>
      </View>

      {/* Day labels */}
      <View style={styles.row}>
        {days.map(d => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {/* Calendar cells */}
      {Array.from({ length: totalCells / 7 }).map((_, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) return <View key={colIdx} style={styles.cell} />;
            const selected = isSelected(day);
            const todayCell = isToday(day);
            return (
              <Pressable
                key={colIdx}
                style={[
                  styles.cell,
                  selected && styles.cellSelected,
                  !selected && todayCell && styles.cellToday,
                ]}
                onPress={() => handleSelect(day)}
              >
                <Text style={[
                  styles.cellText,
                  selected && styles.cellTextSelected,
                  !selected && todayCell && styles.cellTextToday,
                ]}>{day}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.sm, marginTop: Spacing.xs,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  navBtn: { padding: 6 },
  monthYear: { fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  dayLabel: {
    width: 32, textAlign: 'center',
    fontSize: Typography.fontSizeXS, color: Colors.textMuted, fontWeight: Typography.weightSemibold, marginBottom: 4,
  },
  cell: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cellSelected: { backgroundColor: Colors.primary },
  cellToday: { backgroundColor: Colors.primary + '15', borderWidth: 1, borderColor: Colors.primary + '50' },
  cellText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightMedium },
  cellTextSelected: { color: '#FFF', fontWeight: Typography.weightBold },
  cellTextToday: { color: Colors.primary, fontWeight: Typography.weightBold },
});
