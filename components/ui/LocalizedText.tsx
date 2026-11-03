import { memo } from 'react';
import { Text, TextProps } from 'react-native';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
export interface LocalizedTextProps extends TextProps { verbatim?: boolean }
// Use verbatim for names, free-form descriptions, notes and chat messages.
export const LocalizedText = memo(function LocalizedText({ children, verbatim = false, accessibilityLabel, ...props }: LocalizedTextProps) {
  const { content, translate } = useLocalizedCopy(children);
  return <Text {...props} accessibilityLabel={accessibilityLabel ? translate(accessibilityLabel) : undefined}>{verbatim ? children : content}</Text>;
});
