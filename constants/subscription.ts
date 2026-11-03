import { Colors } from '@/constants/theme';

export type SubscriptionTier = 'basic' | 'pro' | 'elite' | 'club_basic' | 'club_pro' | 'club_elite';
export type FeatureFlag = 'swiss_athletics_import' | 'performance_charts' | 'session_video' | 'pdf_export' | 'advanced_analytics' | 'season_comparison' | 'multi_coach' | 'club_dashboard' | 'custom_branding' | 'priority_support' | 'unlimited_athletes' | 'unlimited_plans' | 'unlimited_channels' | 'unlimited_competitions' | 'invite_athletes' | 'pb_tracking' | 'results_history' | 'club_admin' | 'invite_coaches';
export interface TierConfig {
  id: SubscriptionTier; track: 'indie' | 'club'; name: string; price: string; priceNote?: string;
  subtitle?: string; color: string; gradient?: [string, string]; icon: string; badge: string;
  limits: { athletes: number; trainingPlans: number; competitions: number; channels: number; coaches: number; committeeMembers: number };
  features: FeatureFlag[];
}
// Quotas count saved records, not annual usage. -1 means unlimited.
// Committee seats are a product allowance only: shared accounts are not connected yet.
const essentials: FeatureFlag[] = ['pb_tracking', 'results_history'];
const individual: FeatureFlag[] = [...essentials, 'performance_charts'];
const analysis: FeatureFlag[] = [...individual, 'season_comparison', 'advanced_analytics', 'pdf_export'];
const clubEssentials: FeatureFlag[] = [...essentials, 'club_admin', 'invite_coaches', 'club_dashboard'];
export const INDIE_TIERS: TierConfig[] = [
  { id: 'basic', track: 'indie', name: 'Basic', price: 'CHF 5.90', priceNote: '/mois', subtitle: 'Démarrer avec un petit groupe', color: Colors.textSecondary, gradient: [Colors.textSecondary, Colors.textPrimary], icon: 'star-outline', badge: 'BASIC',
    limits: { athletes: 5, trainingPlans: 3, competitions: 5, channels: 1, coaches: 0, committeeMembers: 0 }, features: essentials },
  { id: 'pro', track: 'indie', name: 'Pro', price: 'CHF 9.90', priceNote: '/mois', subtitle: 'Structurer votre groupe et suivre chaque athlète', color: Colors.info, gradient: [Colors.info, Colors.clubProDark], icon: 'star-half', badge: 'PRO',
    limits: { athletes: 25, trainingPlans: 15, competitions: 20, channels: 5, coaches: 0, committeeMembers: 0 }, features: individual },
  { id: 'elite', track: 'indie', name: 'Elite', price: 'CHF 19.90', priceNote: '/mois', subtitle: 'Piloter la performance sans limite de volume', color: Colors.clubElite, gradient: [Colors.clubElite, Colors.clubEliteDark], icon: 'star', badge: 'ELITE',
    limits: { athletes: -1, trainingPlans: -1, competitions: -1, channels: -1, coaches: 0, committeeMembers: 0 }, features: [...analysis, 'unlimited_athletes', 'unlimited_plans', 'unlimited_channels', 'unlimited_competitions'] },
];
export const CLUB_TIERS: TierConfig[] = [
  { id: 'club_basic', track: 'club', name: 'Club Basic', price: 'CHF 29.90', priceNote: '/mois', subtitle: 'Organiser une petite structure', color: Colors.club, gradient: [Colors.club, Colors.clubDark], icon: 'corporate-fare', badge: 'CLUB BASIC',
    limits: { athletes: 50, trainingPlans: 10, competitions: 15, channels: 3, coaches: 2, committeeMembers: 1 }, features: clubEssentials },
  { id: 'club_pro', track: 'club', name: 'Club Pro', price: 'CHF 59.90', priceNote: '/mois', subtitle: 'Développer plusieurs groupes et leurs performances', color: Colors.clubPro, gradient: [Colors.clubPro, Colors.clubProDark], icon: 'business', badge: 'CLUB PRO',
    limits: { athletes: 150, trainingPlans: 40, competitions: 50, channels: 10, coaches: 5, committeeMembers: 3 }, features: [...clubEssentials, 'performance_charts', 'pdf_export'] },
  { id: 'club_elite', track: 'club', name: 'Club Elite', price: 'CHF 99.90', priceNote: '/mois', subtitle: 'Toute votre structure, sans aucune limite', color: Colors.clubElite, gradient: [Colors.clubElite, Colors.clubEliteDark], icon: 'verified', badge: 'CLUB ELITE',
    limits: { athletes: -1, trainingPlans: -1, competitions: -1, channels: -1, coaches: -1, committeeMembers: -1 }, features: [...clubEssentials, ...analysis, 'unlimited_athletes', 'unlimited_plans', 'unlimited_channels', 'unlimited_competitions'] },
];
export const SUBSCRIPTION_TIERS = [...INDIE_TIERS, ...CLUB_TIERS];
export interface FeatureInfo { key: FeatureFlag; labelKey: string; descKey: string; minTierIndie: SubscriptionTier | null; minTierClub: SubscriptionTier | null; icon: string }
const indieOrder: SubscriptionTier[] = ['basic', 'pro', 'elite'];
const clubOrder: SubscriptionTier[] = ['club_basic', 'club_pro', 'club_elite'];
export function tierMeetsRequirement(current: SubscriptionTier, required: SubscriptionTier): boolean {
  const order = getTierTrack(current) === 'club' ? clubOrder : indieOrder;
  return order.includes(required) && order.indexOf(current) >= order.indexOf(required);
}
export function getTierConfig(tier: SubscriptionTier): TierConfig { return SUBSCRIPTION_TIERS.find(item => item.id === tier) ?? INDIE_TIERS[0]; }
export function getTierTrack(tier: SubscriptionTier): 'indie' | 'club' { return clubOrder.includes(tier) ? 'club' : 'indie'; }
export function canUseFeature(tier: SubscriptionTier, feature: FeatureFlag): boolean { return getTierConfig(tier).features.includes(feature); }
export function checkLimit(tier: SubscriptionTier, key: keyof TierConfig['limits'], count: number): boolean { const limit = getLimit(tier, key); return limit === -1 || count < limit; }
export function getLimit(tier: SubscriptionTier, key: keyof TierConfig['limits']): number { return getTierConfig(tier).limits[key]; }
export function getNextTier(current: SubscriptionTier): TierConfig | null {
  const order = getTierTrack(current) === 'club' ? clubOrder : indieOrder;
  const next = order[order.indexOf(current) + 1];
  return next ? getTierConfig(next) : null;
}
