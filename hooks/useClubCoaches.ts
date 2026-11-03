import { useContext } from 'react';
import { ClubCoachesContext } from '@/contexts/ClubCoachesContext';

export function useClubCoaches() {
  const context = useContext(ClubCoachesContext);
  if (!context) throw new Error('useClubCoaches must be used within ClubCoachesProvider');
  return context;
}
