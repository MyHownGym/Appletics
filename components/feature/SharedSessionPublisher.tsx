import { memo } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { MiniCalendar } from '@/components/ui/MiniCalendar';
import { useSharedSessionPublisher } from '@/hooks/useSharedSessionPublisher';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { sharedStyles as styles } from '@/constants/sharedStyles';
import type { TrainingSession } from '@/types';
interface SharedSessionPublisherProps { groupId: string; sourceSession?: TrainingSession; sourceKey?: string; onPublished?: (id: string) => void }
export const SharedSessionPublisher = memo(function SharedSessionPublisher({ groupId,sourceSession,sourceKey,onPublished }: SharedSessionPublisherProps) {
 const form = useSharedSessionPublisher(groupId,sourceSession,sourceKey); const { translate } = useLocalizedCopy();
 return <View style={styles.card}><Text style={styles.heading}>Publier une séance</Text><Text style={styles.label}>Titre de la séance</Text><TextInput accessibilityLabel={translate('Titre de la séance')} value={form.title} onChangeText={form.setTitle} editable={!form.busy} maxLength={160} style={styles.input} /><Text style={styles.label}>Date de la séance</Text><MiniCalendar value={form.date} onChange={form.setDate} /><Text style={styles.label}>Consignes</Text><TextInput accessibilityLabel={translate('Consignes')} value={form.details} onChangeText={form.setDetails} editable={!form.busy} multiline maxLength={10000} style={styles.input} /><Pressable disabled={form.busy || !form.title.trim()} onPress={() => { void form.publish().then(id => { if (id) onPublished?.(id); }); }} style={({ pressed }) => [styles.button,pressed || form.busy || !form.title.trim() ? styles.pressed : null]}><Text style={styles.buttonText}>Publier dans ce groupe</Text></Pressable>{form.message ? <Text style={[styles.body,styles.success]}>{form.message}</Text> : null}</View>;
});
