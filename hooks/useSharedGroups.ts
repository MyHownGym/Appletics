import { useContext } from 'react';
import { SharedGroupsContext } from '@/contexts/SharedGroupsContext';
export function useSharedGroups() {
 const value = useContext(SharedGroupsContext);
 if (!value) throw new Error('useSharedGroups must be used within SharedGroupsProvider');
 return value;
}
