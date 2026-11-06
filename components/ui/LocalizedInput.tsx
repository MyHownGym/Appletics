import { forwardRef } from 'react';
import { Platform, TextInput, TextInputProps } from 'react-native';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
export interface LocalizedInputProps extends TextInputProps {}
// Values are never translated; only UI placeholder and accessible label are.
export const LocalizedInput = forwardRef<TextInput, LocalizedInputProps>(function LocalizedInput({ placeholder, accessibilityLabel, ...props }, ref) {
  const { translate } = useLocalizedCopy();
  // Web: a text field keeps a default intrinsic width (about 20 characters) and would push buttons off small screens.
  const style = Platform.OS === 'web' ? [{ minWidth: 0 }, props.style] : props.style;
  return <TextInput ref={ref} {...props} style={style} placeholder={placeholder ? translate(placeholder) : undefined} accessibilityLabel={accessibilityLabel ? translate(accessibilityLabel) : placeholder ? translate(placeholder) : undefined} />;
});
