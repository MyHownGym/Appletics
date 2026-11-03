import { memo } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useSharedAthleteHistory } from '@/hooks/useSharedAthleteHistory';
import { sharedStyles as styles } from '@/constants/sharedStyles';
interface SharedAthleteHistoryProps { athleteId: string }
export const SharedAthleteHistory = memo(function SharedAthleteHistory({ athleteId }: SharedAthleteHistoryProps) {
 const history = useSharedAthleteHistory(athleteId); const router = useRouter();
 return <View style={styles.card}><Text style={styles.heading}>Performances partagées</Text>
 <FlatList scrollEnabled={false} data={history.history} keyExtractor={item => item.id} ListEmptyComponent={<Text style={styles.body}>Aucune performance partagée.</Text>} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname:'/shared-group',params:{ id:item.group_id } })} style={({ pressed }) => [styles.card,pressed ? styles.pressed : null]}><Text verbatim style={styles.heading}>{history.sessions.find(session => session.id === item.session_id)?.title ?? ''}</Text><Text verbatim style={styles.subtle}>{item.performed_on} · {history.groups.find(group => group.id === item.group_id)?.name ?? ''}</Text><FlatList scrollEnabled={false} data={item.metrics} keyExtractor={(_,index) => String(index)} renderItem={({ item:metric }) => <View style={styles.row}><Text verbatim style={[styles.body,styles.flex]}>{metric.label}</Text><Text verbatim style={styles.amount}>{metric.value} {metric.unit}</Text></View>} /></Pressable>} />
 <Pressable onPress={() => router.push('/shared-groups')} style={({ pressed }) => [styles.secondary,pressed ? styles.pressed : null]}><Text style={styles.link}>Ouvrir les groupes partagés</Text></Pressable></View>;
});
