// Canonical IDs keep legacy data, filters, badges and athlete groups consistent without changing stored records.
export function normalizeGroupId(group: string): string {
  return group === 'middle_distance' ? 'distance' : group;
}
