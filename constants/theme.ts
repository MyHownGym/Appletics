// Powered by OnSpace.AI
// Theme aligned with Appletics onboarding — orange primary, clean white
export const Colors = {
  // Primary — Appletics orange (from logo/onboarding)
  primary: '#FF5722',
  primaryDark: '#E64A19',
  primaryLight: '#FFF3F0',
  welcomeOrange: '#C73D16',
  welcomeDeep: '#9F2D0B',
  welcomeInk: '#74210A',
  welcomeText: '#FFF5ED',
  welcomeLine: 'rgba(255, 255, 255, 0.15)',
  welcomePanel: 'rgba(255, 255, 255, 0.09)',

  // Backgrounds — pure white / off-white
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.45)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Semantic
  success: '#16A34A',
  club: '#059669',
  clubDark: '#047857',
  clubDeep: '#065F46',
  clubPro: '#0369A1',
  clubProDark: '#075985',
  clubElite: '#B45309',
  clubEliteDark: '#78350F',
  social: '#C02663',
  transparent: 'transparent',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  // Borders
  border: '#EAEDF2',
  borderLight: '#F4F6FA',

  // Event Group Colors
  sprints: '#FF5722',
  distance: '#2563EB',
  field: '#7C3AED',
  hurdles: '#DB2777',
  relay: '#059669',
  jumps: '#A78BFA',
  throws: '#F59E0B',

  // Tab bar
  tabBar: '#FFFFFF',
  tabBarBorder: '#EAEDF2',
};

// Shared session intensity palette: keep picker, cards and calendar dots identical.
export const IntensityColors = {
  easy: '#34D399',
  moderate: '#FBBF24',
  hard: '#FF6B35',
  race: '#F87171',
  rest: '#4A6482',
};

export const Typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeBase: 16,
  fontSizeMD: 18,
  fontSizeLG: 20,
  fontSizeXL: 24,
  fontSizeXXL: 30,
  fontSizeHero: 38,

  weightRegular: '400' as const,
  weightMedium: '500' as const,
  weightSemibold: '600' as const,
  weightBold: '700' as const,
  weightExtrabold: '800' as const,

  lineHeightBody: 1.6,
  lineHeightHeading: 1.2,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  screenPadding: 20,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  strong: {
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
  },
};
