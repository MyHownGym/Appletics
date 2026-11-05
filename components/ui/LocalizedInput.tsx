import { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
export interface LocalizedInputProps extends TextInputProps {}
// Values are never translated; only UI placeholder and accessible label are.
export const LocalizedInput = forwardRef<TextInput, LocalizedInputProps>(function LocalizedInput({ placeholder, accessibilityLabel, ...props }, ref) {
  const { translate } = useLocalizedCopy();
  return <TextInput ref={ref} {...props} placeholder={placeholder ? translate(placeholder) : undefined} accessibilityLabel={accessibilityLabel ? translate(accessibilityLabel) : placeholder ? translate(placeholder) : undefined} />;
});
