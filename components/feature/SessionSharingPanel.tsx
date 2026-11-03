import { memo } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useSessionSharing } from '@/hooks/useSessionSharing';
import { SharedSessionWorkspace } from '@/components/feature/SharedSessionWorkspace';
import { SharedSessionPublisher } from '@/components/feature/SharedSessionPublisher';
import { SubscriptionDisclosure } from '@/components/feature/SubscriptionDisclosure';
import { sharedStyles as styles } from '@/constants/sharedStyles';
import type { TrainingSession, SessionPerformance } from '@/types';
interface SessionSharingPanelProps { planId: string; session: TrainingSession; localPerformance?: SessionPerformance | null }
export const SessionSharingPanel = memo(function SessionSharingPanel({ planId,session,localPerformance }: SessionSharingPanelProps) {
 const shared = useSessionSharing(planId,session.id); const router = useRouter();
 return <View style={styles.card}><Text style={styles.heading}>Performances partagées</Text>
  <Text style={styles.body}>Visible par les coachs de ce groupe et l’athlète concerné.</Text>
  {shared.error ? <Text style={[styles.body,styles.error]}>{shared.error}</Text> : null}
  {shared.groups.length ? <><Text style={styles.label}>Sélectionner un groupe</Text><View style={styles.chips}><FlatList horizontal data={shared.groups} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <Pressable accessibilityState={{ selected: shared.selectedGroup?.id === item.id }} onPress={() => { shared.setGroupId(item.id); shared.setSelectedSession(''); }} style={({ pressed }) => [styles.chip,shared.selectedGroup?.id === item.id ? styles.selected : null,pressed ? styles.pressed : null]}><Text verbatim style={styles.chipText}>{item.name}</Text></Pressable>} /></View>
   {shared.sessions.length ? <><Text style={styles.label}>Sélectionner une séance</Text><View style={styles.chips}><FlatList horizontal data={shared.sessions} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false} renderItem={({ item }) => <Pressable accessibilityState={{ selected: shared.session?.id === item.id }} onPress={() => shared.setSelectedSession(item.id)} style={({ pressed }) => [styles.chip,shared.session?.id === item.id ? styles.selected : null,pressed ? styles.pressed : null]}><Text verbatim style={styles.chipText}>{item.title} · {item.session_date}</Text></Pressable>} /></View></> : null}
   {shared.session ? <SharedSessionWorkspace key={shared.session.id} sessionId={shared.session.id} initialMetrics={localPerformance?.metrics} initialDate={localPerformance?.date} initialNotes={localPerformance?.notes} /> : null}
   {shared.coach && shared.selectedGroup ? <SubscriptionDisclosure title="Partager cette séance"><SharedSessionPublisher key={shared.selectedGroup.id} groupId={shared.selectedGroup.id} sourceSession={session} sourceKey={shared.sourceKey} onPublished={shared.setSelectedSession} /></SubscriptionDisclosure> : null}
  </> : null}
  <Pressable accessibilityRole="button" onPress={() => router.push('/shared-groups')} style={({ pressed }) => [styles.secondary,pressed ? styles.pressed : null]}><Text style={styles.link}>Ouvrir les groupes partagés</Text></Pressable>
 </View>;
});
