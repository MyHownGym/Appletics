import { View, FlatList, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { useSharedGroupsPage } from '@/hooks/useSharedGroupsPage';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { BillingAccountForm } from '@/components/auth/BillingAccountForm';
import { sharedStyles as styles } from '@/constants/sharedStyles';
import { Colors } from '@/constants/theme';
export default function SharedGroupsScreen() {
 const page = useSharedGroupsPage(); const router = useRouter(); const { translate } = useLocalizedCopy();
 return <SafeAreaView edges={['top','bottom']} style={styles.screen}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
  <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel={translate('Retour')} onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable><Text style={styles.title}>Groupes partagés</Text><Pressable disabled={page.busy} accessibilityLabel={translate('Actualiser')} onPress={() => { void page.refresh(); }} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="refresh" size={24} color={Colors.clubDeep} /></Pressable></View>
  <FlatList style={styles.flex} contentContainerStyle={styles.content} data={page.data.groups} keyExtractor={item => item.id} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
   ListHeaderComponent={<View style={styles.stack}>
    <View style={styles.hero}><Text style={styles.heroTitle}>Coachs et athlètes, dans le même groupe.</Text><Text style={styles.heroText}>Visible par les coachs de ce groupe et l’athlète concerné.</Text></View>
    {!page.userId ? <BillingAccountForm checkout /> : null}
    {page.loading ? <ActivityIndicator color={Colors.clubDeep} /> : null}
    {page.error ? <View style={styles.errorRow}><MaterialIcons name="error-outline" size={22} color={Colors.error} /><Text style={[styles.body, styles.error]}>{page.error}</Text></View> : null}
    {page.invitations.length ? <View style={styles.card}><Text style={styles.heading}>Invitations reçues</Text><FlatList scrollEnabled={false} data={page.invitations} keyExtractor={item => item.id} renderItem={({ item }) => <View style={styles.card}><Text verbatim style={styles.heading}>{item.group_name}</Text><Text style={styles.body}>{item.role === 'coach' ? 'Coach' : 'Athlète'}</Text><Text style={styles.body}>En acceptant, vous rejoignez ce groupe. Les coachs auront accès à vos performances partagées.</Text><Text verbatim style={styles.subtle}>{item.email}</Text><View style={styles.row}><Pressable disabled={page.busy} onPress={() => { void page.answer(item.id,true); }} style={({ pressed }) => [styles.button, pressed || page.busy ? styles.pressed : null]}><Text style={styles.buttonText}>Accepter</Text></Pressable><Pressable disabled={page.busy} onPress={() => { void page.answer(item.id,false); }} style={({ pressed }) => [styles.secondary, pressed ? styles.pressed : null]}><Text style={styles.link}>Refuser</Text></Pressable></View></View>} /></View> : null}
    {page.canCreate && page.userId ? <View style={styles.card}><Text style={styles.heading}>Créer un groupe</Text><Text style={styles.label}>Nom du groupe</Text><TextInput accessibilityLabel={translate('Nom du groupe')} value={page.name} onChangeText={page.setName} maxLength={100} style={styles.input} /><Pressable disabled={page.busy || !page.name.trim()} onPress={() => { void page.create().then(id => { if (id) router.push({ pathname: '/shared-group', params: { id } }); }); }} style={({ pressed }) => [styles.button, pressed || page.busy || !page.name.trim() ? styles.pressed : null]}><Text style={styles.buttonText}>Créer un groupe</Text></Pressable></View> : null}
   </View>}
   renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/shared-group', params: { id: item.id } })} style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}><View style={styles.row}><MaterialIcons name="groups" size={28} color={Colors.clubDeep} /><Text verbatim style={[styles.heading,styles.flex]}>{item.name}</Text><MaterialIcons name="chevron-right" size={24} color={Colors.clubDeep} /></View><Text style={styles.subtle}>Groupe partagé</Text></Pressable>}
   ListEmptyComponent={!page.loading ? <Text style={styles.body}>Aucun groupe partagé.</Text> : null}
  />
 </KeyboardAvoidingView></SafeAreaView>;
}
