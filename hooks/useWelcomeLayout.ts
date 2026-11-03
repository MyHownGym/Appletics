import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '@/hooks/useResponsive';
import { Spacing, Typography } from '@/constants/theme';
export function useWelcomeLayout() {
  const { width, height, screenPadding } = useResponsive();
  const insets = useSafeAreaInsets();
  const availableHeight = Math.max(1, height - insets.top - insets.bottom);
  const landscape = width > height && width >= 600;
  const compact = availableHeight < 640;
  return { landscape, compact, padding: compact ? Spacing.md : Spacing.lg, horizontal: screenPadding,
    gap: availableHeight < 500 ? Spacing.sm : compact ? Spacing.md : Spacing.lg,
    logoSize: landscape ? 32 : compact ? 40 : 48,
    headlineSize: width >= 768 && !landscape ? Typography.fontSizeXXL : Typography.fontSizeXL,
    trackHeight: Math.max(0, Math.min(220, availableHeight - (landscape ? 290 : 460))),
  };
}
