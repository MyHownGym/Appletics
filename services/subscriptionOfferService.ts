import { FeatureFlag, TierConfig } from '@/constants/subscription';
import { BillingCycle, subscriptionPrices } from '@/constants/subscriptionPricing';
export interface OfferRow { id: string; label: string; value: string; included: boolean; planned?: boolean }
export function quotaText(value: number): string { return value === -1 ? 'Illimité' : String(value); }
export function getOfferRows(plan: TierConfig): OfferRow[] {
  const capacity: { key: keyof TierConfig['limits']; label: string }[] = [
    ...(plan.track === 'club' ? [{ key: 'coaches' as const, label: 'Coachs actifs ou en attente' }] : []),
    { key: 'athletes', label: 'Fiches athlètes' }, { key: 'trainingPlans', label: 'Plans enregistrés' },
    { key: 'competitions', label: 'Compétitions enregistrées' }, { key: 'channels', label: 'Groupes de discussion' },
  ];
  const features: { key: FeatureFlag; label: string }[] = [
    { key: 'pb_tracking', label: 'Records personnels (PBs)' }, { key: 'results_history', label: 'Historique des résultats' },
    { key: 'performance_charts', label: 'Graphiques individuels · toutes les épreuves' },
    { key: 'season_comparison', label: 'Comparaison détaillée entre saisons' },
    { key: 'advanced_analytics', label: 'Analyses équipe · charge, groupes, tendances' },
    { key: 'pdf_export', label: 'Export PDF · plans, résultats, fiches' },
  ];
  return [
    ...capacity.map(({ key, label }) => ({ id: key, label, value: quotaText(plan.limits[key]), included: true })),
    { id: 'calendar', label: 'Calendrier et séances', value: 'Inclus', included: true },
    ...features.map(({ key, label }) => ({ id: key, label, value: plan.features.includes(key) ? 'Inclus' : 'Non inclus', included: plan.features.includes(key) })),
    ...(plan.track === 'club' ? [{ id: 'dashboard', label: 'Tableau de bord et annuaire club', value: 'Inclus', included: true }, { id: 'committee', label: 'Membres du comité · administrateur inclus', value: quotaText(plan.limits.committeeMembers), included: true }] : []),
  ];
}
export function getOfferPrice(plan: TierConfig, cycle: BillingCycle) {
  const prices = subscriptionPrices[plan.id];
  const amount = prices[cycle];
  const annualTotal = cycle === 'annual' ? amount : amount * 12;
  const saving = Math.max(0, prices.monthly * 12 - annualTotal);
  return { amount, amountText: amount === 0 ? 'Gratuit' : `CHF ${amount.toFixed(2)}`, unit: amount === 0 ? 'Sans paiement' : cycle === 'annual' ? '/an' : '/mois', annualTotal, saving };
}
