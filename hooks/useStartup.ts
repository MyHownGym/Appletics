import { useContext } from 'react';
import { StartupContext } from '@/contexts/StartupContext';
export function useStartup() {
  const context = useContext(StartupContext);
  if (!context) throw new Error('useStartup must be used within StartupProvider');
  return context;
}
