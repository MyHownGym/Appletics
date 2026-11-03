import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@/constants/subscription';
const storageKey = '@appletics_subscription_preview';
// Device-local preview selection only. Never proof of a paid entitlement.
export async function loadSubscriptionPreview(): Promise<SubscriptionTier> {
  const saved = await AsyncStorage.getItem(storageKey);
  return SUBSCRIPTION_TIERS.some(plan => plan.id === saved) ? saved as SubscriptionTier : 'basic';
}
export function saveSubscriptionPreview(tier: SubscriptionTier): Promise<void> { return AsyncStorage.setItem(storageKey, tier); }
export function clearSubscriptionPreview(): Promise<void> { return AsyncStorage.removeItem(storageKey); }
