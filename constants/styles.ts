// Powered by OnSpace.AI
// cache-bust
import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Typography, Shadow } from './theme';

export const GlobalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenPadded: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  },
  card: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  cardElevated: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadow.strong,
  },
  sectionTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.weightSemibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.weightBold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.textOnPrimary,
    fontSize: Typography.fontSizeBase,
    fontWeight: Typography.weightBold,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: Radius.md,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeBase,
    fontWeight: Typography.weightSemibold,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    fontSize: Typography.fontSizeBase,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.weightMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.weightSemibold,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSizeBase,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 24,
  },
});
