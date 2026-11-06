import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

// Password field with an eye button to show or hide what was typed.
export const PasswordInput = forwardRef<TextInput, TextInputProps>(function PasswordInput({ style, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.wrap}>
    <TextInput ref={ref} {...props} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} style={[style, styles.input]} />
    <Pressable accessibilityRole="button" accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onPress={() => setVisible(value => !value)} hitSlop={8} style={({ pressed }) => [styles.eye, pressed ? styles.pressed : null]}>
      <MaterialIcons name={visible ? 'visibility-off' : 'visibility'} size={22} color={Colors.textSecondary} />
    </Pressable>
  </View>;
});
const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
  input: { paddingRight: 52 },
  eye: { position: 'absolute', right: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  pressed: { opacity: 0.6 },
});
