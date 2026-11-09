import { ScrollView, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LocalizedText as Text } from '@/components/ui/LocalizedText';
import { TrainingLogList } from '@/components/feature/TrainingLogList';
import { sharedStyles as styles } from '@/constants/sharedStyles';
import { Colors } from '@/constants/theme';
import { webScroll } from '@/constants/webScroll';

// Every time and measure entered by the coach's athletes on their training sessions, newest first.
export default function TrainingLogScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}><MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} /></Pressable>
      <Text style={styles.title}>Entraînements des athlètes</Text>
    </View>
    <ScrollView style={[styles.flex, webScroll]} contentContainerStyle={styles.content}>
      <TrainingLogList title="Toutes les saisies" limit={500} empty="Aucun athlète n’a encore saisi de temps ou de mesure." />
    </ScrollView>
  </SafeAreaView>;
}
