import { useContext } from 'react';
import { BillingContext } from '@/contexts/BillingContext';
export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) throw new Error('useBilling must be used within BillingProvider');
  return context;
}
