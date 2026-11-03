export function parseCoachAthleteCount(input: string): { value: number | undefined; valid: boolean } {
  const trimmed = input.trim();
  if (!trimmed) return { value: undefined, valid: true };
  if (!/^\d{1,6}$/.test(trimmed)) return { value: undefined, valid: false };
  const value = Number(trimmed);
  return { value, valid: Number.isSafeInteger(value) && value >= 0 && value <= 999999 };
}
