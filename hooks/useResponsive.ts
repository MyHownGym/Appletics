// Powered by OnSpace.AI
// Responsive hook — breakpoints for phone, tablet, desktop
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export type ScreenSize = 'phone' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  width: number;
  height: number;
  size: ScreenSize;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  /** Number of columns for grid layouts */
  cols: number;
  /** Horizontal padding for screen edges */
  screenPadding: number;
  /** Max content width (centered on large screens) */
  maxContentWidth: number;
}

function getInfo(rawWidth: number, rawHeight: number): ResponsiveInfo {
  const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : 375;
  const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 667;
  const size: ScreenSize =
    width >= 1024 ? 'desktop' : width >= 600 ? 'tablet' : 'phone';
  return {
    width,
    height,
    size,
    isPhone: size === 'phone',
    isTablet: size === 'tablet',
    isDesktop: size === 'desktop',
    cols: size === 'desktop' ? 3 : size === 'tablet' ? 2 : 1,
    screenPadding: size === 'phone' ? 20 : size === 'tablet' ? 32 : 40,
    // Computer: almost the whole width next to the sidebar (220 px), capped only on very large screens.
    maxContentWidth: size === 'desktop' ? Math.min(1680, Math.max(0, width - 220)) : width,
  };
}

export function useResponsive(): ResponsiveInfo {
  const [info, setInfo] = useState<ResponsiveInfo>(() => getInfo(375, 667));

  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    setInfo(getInfo(width, height));
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setInfo(getInfo(window.width, window.height));
    });
    return () => sub.remove();
  }, []);

  return info;
}
