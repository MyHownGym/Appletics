import { memo } from 'react';
import { View, ScrollView, FlatList, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { useHomeSchedule } from '@/hooks/useHomeSchedule';
import { useCoachRoles } from '@/hooks/useCoachRoles';
import { CompetitionCard } from '@/components';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { IntensityDot } from '@/components/ui/IntensityDot';
import { IntensityLegend } from '@/components/ui/IntensityLegend';
import { INTENSITY_LEVELS, getIntensityColor } from '@/constants/config';
import { clubRoleLabels } from '@/constants/club';
import { HomeActivitySummary } from '@/components/feature/HomeActivitySummary';
import { AppBrand } from '@/components/feature/AppBrand';
import { SubscriptionPlanCard } from '@/components/feature/SubscriptionPlanCard';
import { PendingInvitationsBanner } from '@/components/feature/PendingInvitationsBanner';
import type { ScheduleEntry } from '@/services/homeScheduleService';
import { TrainingLogList } from '@/components/feature/TrainingLogList';

interface HomeCalendarProps { schedule: ReturnType<typeof useHomeSchedule> }
const HomeCalendar = memo(function HomeCalendar({ schedule }: HomeCalendarProps) {
  const { t } = useI18n();
  return <View style={styles.calendar}>
    <View style={styles.calendarHeading}>
      <Pressable accessibilityLabel={t('Mois précédent')} onPress={() => schedule.changeMonth(-1)} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="chevron-left" size={24} color={Colors.textSecondary} /></Pressable>
      <Text style={styles.monthTitle}>{schedule.monthTitle}</Text>
      <Pressable accessibilityLabel={t('Mois suivant')} onPress={() => schedule.changeMonth(1)} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} /></Pressable>
    </View>
    <View style={styles.dayHeadings}>{schedule.dayLabels.map((label, index) => <Text key={index} style={styles.dayHeading}>{label}</Text>)}</View>
    <View style={styles.calendarGrid}>{schedule.cells.map((cell, index) => cell ? <Pressable key={cell.key} accessibilityRole="button" accessibilityLabel={`${cell.day} ${schedule.monthTitle}, ${cell.sessions.length} ${t('sessions')}`} onPress={() => schedule.setSelectedDate(cell.key)} style={({ pressed }) => [styles.dayCell, cell.key === schedule.today ? styles.todayCell : null, cell.key === schedule.selectedDate ? styles.selectedCell : null, pressed ? styles.pressed : null]}>
      <Text style={[styles.dayNumber, cell.key === schedule.today ? styles.todayText : null]}>{cell.day}</Text>
      <View style={styles.dots}>{cell.sessions.slice(0, 3).map(entry => <IntensityDot key={`${entry.planId}-${entry.session.id}`} intensity={entry.session.intensity} size={6} />)}{cell.competition ? <MaterialIcons name="emoji-events" size={10} color={Colors.warning} /> : null}{cell.sessions.length > 3 ? <Text style={styles.small}>+{cell.sessions.length - 3}</Text> : null}</View>
    </Pressable> : <View key={`blank-${index}`} style={styles.dayCell} />)}</View>
    <IntensityLegend showCompetitions />
  </View>;
});
interface SessionCardProps { entry: ScheduleEntry; compact?: boolean }
const SessionCard = memo(function SessionCard({ entry, compact = false }: SessionCardProps) {
  const router = useRouter();
  const { t } = useI18n();
  const { session, planId, planTitle } = entry;
  const intensity = INTENSITY_LEVELS.find(level => level.id === session.intensity);
  return <Pressable onPress={() => router.push({ pathname: '/plan-detail', params: { id: planId } })} style={({ pressed }) => [styles.session, { borderLeftColor: getIntensityColor(session.intensity) }, pressed ? styles.pressed : null]}>
    <View style={styles.sessionHeading}><IntensityDot intensity={session.intensity} /><Text verbatim style={styles.sessionTitle}>{session.title}</Text>{session.duration > 0 ? <Text style={styles.small}>{session.duration} min</Text> : null}</View>
    <Text verbatim style={styles.sessionPlan}>{planTitle}{!compact && intensity ? ` · ${t(intensity.labelKey)}` : ''}</Text>
    {!compact && session.details ? <Text verbatim style={styles.sessionDetails} numberOfLines={2}>{session.details}</Text> : null}
  </Pressable>;
});

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { t } = useI18n();
  const { roleLabel } = useCoachRoles();
  const { screenPadding, maxContentWidth } = useResponsive();
  const schedule = useHomeSchedule();
  const isAthlete = user.userType === 'athlete';
  const isClub = user.accountType === 'club';
  const accent = isClub ? Colors.club : isAthlete ? Colors.info : Colors.primary;
  // A coach whose stored role is still the athlete default (older profiles) is shown as head coach.
  const role = isAthlete ? t('Athlète') : isClub ? t(clubRoleLabels[user.role] ?? user.role) : roleLabel(!user.role || user.role === 'Athlete' ? 'Head Coach' : user.role);
  const clubName = user.club && user.club !== 'Athletics Club' ? user.club : '';
  const quickActions = [
    { id: 'plan', icon: 'add-chart', label: t('new_plan'), color: Colors.info, route: '/plan-create' },
    { id: 'competition', icon: 'emoji-events', label: t('add_meet'), color: Colors.warning, route: '/competition-create' },
    { id: 'athlete', icon: 'person-add', label: t('add_athlete'), color: Colors.primary, route: '/athlete-add' },
    { id: 'chat', icon: 'chat', label: t('messages'), color: Colors.success, route: '/(tabs)/chat' },
  ];
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { maxWidth: maxContentWidth }]}>
      <LinearGradient colors={[accent + '12', Colors.background]} style={[styles.hero, { paddingHorizontal: screenPadding }]}>
        <View style={styles.heroInfo}><AppBrand /><Text style={styles.date}>{schedule.dateLabel}</Text><Text verbatim style={styles.greeting}>{t('good_morning')} {user.name.split(' ')[0]}</Text><View style={styles.roleRow}><View style={[styles.dot, { backgroundColor: accent }]} /><Text verbatim style={styles.role}>{role}{clubName ? ` · ${clubName}` : ''}</Text></View></View>
        <Pressable accessibilityLabel={t('Ouvrir mon profil')} onPress={() => router.push('/(tabs)/profile')} style={({ pressed }) => [pressed ? styles.pressed : null]}>{user.avatar ? <Image source={{ uri: user.avatar }} transition={200} contentFit="cover" style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: accent }]}><Text verbatim style={styles.initials}>{user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}</Text></View>}</Pressable>
      </LinearGradient>
      <PendingInvitationsBanner horizontalPadding={screenPadding} />
      {!isAthlete ? <TrainingLogList title="Derniers entraînements de vos athlètes" limit={5} horizontalPadding={screenPadding} /> : null}
      <SubscriptionPlanCard compact />
      <HomeActivitySummary horizontalPadding={screenPadding} />
      <View style={[styles.section, { paddingHorizontal: screenPadding }]}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t('Calendrier')}</Text><Pressable onPress={schedule.toggleCalendar} style={({ pressed }) => [styles.calendarToggle, schedule.showCalendar ? styles.calendarToggleActive : null, pressed ? styles.pressed : null]}><MaterialIcons name={schedule.showCalendar ? 'expand-less' : 'expand-more'} size={18} color={schedule.showCalendar ? Colors.textOnPrimary : Colors.primary} /><Text style={[styles.toggleText, schedule.showCalendar ? styles.onPrimary : null]}>{t(schedule.showCalendar ? 'Masquer' : 'Afficher')}</Text></Pressable></View>
        {schedule.showCalendar ? <><HomeCalendar schedule={schedule} />{schedule.selectedDate ? <View style={styles.selectedPanel}>
          <View style={styles.sectionHeading}><Text style={styles.selectedDate}>{schedule.selectedLabel}</Text><Pressable accessibilityLabel={t('Fermer le détail du jour')} onPress={() => schedule.setSelectedDate(null)} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="close" size={20} color={Colors.textSecondary} /></Pressable></View>
          <FlatList scrollEnabled={false} data={schedule.selectedSessions} keyExtractor={entry => `${entry.planId}-${entry.session.id}`} renderItem={({ item }) => <SessionCard entry={item} compact />} ListEmptyComponent={<Text style={styles.emptyText}>{t('Aucune séance planifiée ce jour')}</Text>} />
          <FlatList scrollEnabled={false} data={schedule.selectedCompetitions} keyExtractor={competition => competition.id} renderItem={({ item }) => <CompetitionCard competition={item} onPress={() => router.push({ pathname: '/competition-detail', params: { id: item.id } })} />} />
        </View> : null}</> : null}
      </View>
      <View style={[styles.section, { paddingHorizontal: screenPadding }]}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t('todays_training')}</Text><Pressable onPress={() => router.push('/(tabs)/plans')} style={({ pressed }) => [styles.linkButton, pressed ? styles.pressed : null]}><Text style={styles.link}>{t('see_all')}</Text></Pressable></View>
        <FlatList scrollEnabled={false} data={schedule.sessions} keyExtractor={entry => `${entry.planId}-${entry.session.id}`} renderItem={({ item }) => <SessionCard entry={item} />} ListEmptyComponent={<View style={styles.emptyCard}><MaterialIcons name="self-improvement" size={32} color={Colors.textMuted} /><Text style={styles.emptyText}>{t('rest_day')}</Text></View>} />
      </View>
      <View style={[styles.section, { paddingHorizontal: screenPadding }]}>
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{t('upcoming_meets')}</Text><Pressable onPress={() => router.push('/(tabs)/competitions')} style={({ pressed }) => [styles.linkButton, pressed ? styles.pressed : null]}><Text style={styles.link}>{t('see_all')}</Text></Pressable></View>
        <FlatList scrollEnabled={false} data={schedule.upcoming} keyExtractor={competition => competition.id} renderItem={({ item }) => <CompetitionCard competition={item} onPress={() => router.push({ pathname: '/competition-detail', params: { id: item.id } })} />} ListEmptyComponent={<View style={styles.emptyCard}><MaterialIcons name="event" size={32} color={Colors.textMuted} /><Text style={styles.emptyText}>{t('no_meets')}</Text></View>} />
      </View>
      <View style={[styles.section, { paddingHorizontal: screenPadding }]}>{isAthlete ? <Pressable onPress={() => router.push({ pathname: '/(tabs)/profile', params: { section: 'progression', focusId: String(Date.now()) } })} style={({ pressed }) => [styles.athleteShortcut, pressed ? styles.pressed : null]}><MaterialIcons name="bar-chart" size={22} color={Colors.info} /><Text style={styles.shortcutText}>{t('Voir mes stats & progression')}</Text><MaterialIcons name="arrow-forward-ios" size={16} color={Colors.info} /></Pressable> : <><Text style={styles.sectionTitle}>{t('quick_actions')}</Text><FlatList data={quickActions} keyExtractor={item => item.id} numColumns={2} scrollEnabled={false} columnWrapperStyle={styles.quickRow} renderItem={({ item }) => <Pressable onPress={() => router.push(item.route as any)} style={({ pressed }) => [styles.quickCard, Shadow.card, pressed ? styles.primaryPressed : null]}><View style={[styles.quickIcon, { backgroundColor: item.color + '15' }]}><MaterialIcons name={item.icon as any} size={24} color={item.color} /></View><Text style={styles.quickLabel}>{item.label}</Text></Pressable>} /></>}</View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background }, scroll: { flex: 1 }, content: { width: '100%', alignSelf: 'center', paddingBottom: 120 },
  hero: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.lg, marginBottom: Spacing.sm, borderBottomLeftRadius: Radius.xl, borderBottomRightRadius: Radius.xl },
  heroInfo: { flex: 1, gap: Spacing.xs }, date: { fontSize: Typography.fontSizeXS, color: Colors.textMuted, textTransform: 'capitalize' }, greeting: { fontSize: Typography.fontSizeLG, color: Colors.textPrimary, fontWeight: Typography.weightExtrabold }, roleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, dot: { width: 7, height: 7, borderRadius: Radius.full }, role: { flex: 1, fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary }, avatar: { width: 52, height: 52, borderRadius: Radius.full }, avatarFallback: { alignItems: 'center', justifyContent: 'center' }, initials: { fontSize: Typography.fontSizeBase, color: Colors.textOnPrimary, fontWeight: Typography.weightBold },
  section: { marginBottom: Spacing.lg }, sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm, marginBottom: Spacing.sm }, sectionTitle: { flex: 1, fontSize: Typography.fontSizeMD, fontWeight: Typography.weightBold, color: Colors.textPrimary, includeFontPadding: false },
  calendarToggle: { minHeight: 44, paddingHorizontal: Spacing.md, borderRadius: Radius.full, backgroundColor: Colors.primaryLight, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }, calendarToggleActive: { backgroundColor: Colors.primary }, toggleText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.primary }, onPrimary: { color: Colors.textOnPrimary },
  calendar: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md }, calendarHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, monthTitle: { flex: 1, textAlign: 'center', fontSize: Typography.fontSizeBase, fontWeight: Typography.weightBold, color: Colors.textPrimary, textTransform: 'capitalize' }, iconButton: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' }, dayHeadings: { flexDirection: 'row', marginBottom: Spacing.sm }, dayHeading: { flex: 1, fontSize: Typography.fontSizeXS, textAlign: 'center', color: Colors.textSecondary }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: `${100 / 7}%`, minHeight: 48, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' }, todayCell: { backgroundColor: Colors.primaryLight }, selectedCell: { borderWidth: 1, borderColor: Colors.primary }, dayNumber: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary }, todayText: { color: Colors.primary, fontWeight: Typography.weightBold }, dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 2, minHeight: 12 },
  selectedPanel: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginTop: Spacing.sm, borderRadius: Radius.lg }, selectedDate: { flex: 1, fontSize: Typography.fontSizeSM, fontWeight: Typography.weightBold, color: Colors.primary, textTransform: 'capitalize' },
  session: { borderWidth: 1, borderLeftWidth: 4, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, backgroundColor: Colors.surface, marginBottom: Spacing.sm, gap: Spacing.xs }, sessionHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, sessionTitle: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.textPrimary }, sessionPlan: { fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.primary }, sessionDetails: { fontSize: Typography.fontSizeSM, lineHeight: 21, color: Colors.textSecondary }, small: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary },
  linkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm }, link: { fontSize: Typography.fontSizeSM, fontWeight: Typography.weightSemibold, color: Colors.primary }, emptyCard: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: Radius.md }, emptyText: { fontSize: Typography.fontSizeSM, lineHeight: 21, textAlign: 'center', color: Colors.textMuted },
  quickRow: { gap: Spacing.sm }, quickCard: { flex: 1, minWidth: 1, alignItems: 'center', padding: Spacing.md, marginTop: Spacing.sm, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, backgroundColor: Colors.surface }, quickIcon: { width: 52, height: 52, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' }, quickLabel: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.weightSemibold, textAlign: 'center' }, athleteShortcut: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.info + '30', backgroundColor: Colors.info + '10' }, shortcutText: { flex: 1, fontSize: Typography.fontSizeBase, fontWeight: Typography.weightSemibold, color: Colors.info }, pressed: { opacity: 0.75 }, primaryPressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
