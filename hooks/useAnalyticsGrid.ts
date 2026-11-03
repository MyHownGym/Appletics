import { useCallback, useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { Spacing } from '@/constants/theme';

export function useAnalyticsGrid() {
  const [width, setWidth] = useState(335);
  const [fontScale, setFontScale] = useState(1);
  useEffect(() => {
    const refresh = () => {
      const scale = Dimensions.get('window').fontScale;
      setFontScale(Number.isFinite(scale) && scale > 0 ? scale : 1);
    };
    refresh();
    const listener = Dimensions.addEventListener('change', refresh);
    return () => listener.remove();
  }, []);
  const onWidthChange = useCallback((value: number) => {
    if (Number.isFinite(value) && value > 0) setWidth(value);
  }, []);
  const gap = Spacing.sm;
  const columns = Math.max(1, Math.min(width >= 760 ? 4 : 2, Math.floor((width + gap) / (152 * fontScale + gap))));
  return { columns, cardWidth: Math.max(1, (width - gap * (columns - 1)) / columns), onWidthChange };
}
