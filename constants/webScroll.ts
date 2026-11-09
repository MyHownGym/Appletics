import { Platform } from 'react-native';

// Web (iPhone PWA): lists inside a full-screen modal must scroll on their own.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const webScroll = Platform.OS === 'web' ? ({ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' } as any) : null;
