// 30-day free trial with every Pro feature, without a card. It starts when the account is created,
// and never before the public launch (accounts made during the beta all start on launch day).
export const TRIAL_DAYS = 30;
export const LAUNCH_DATE = '2026-12-01';
const DAY = 86400000;

export interface TrialInfo { active: boolean; expired: boolean; daysLeft: number; endsAt: string; startedAt: string; progress: number }

export function trialInfo(createdAt: string | undefined | null, now = Date.now()): TrialInfo {
  const created = createdAt ? Date.parse(createdAt) : now;
  const start = Math.max(Number.isNaN(created) ? now : created, Date.parse(`${LAUNCH_DATE}T00:00:00+01:00`));
  const end = start + TRIAL_DAYS * DAY;
  const left = end - now;
  const daysLeft = Math.max(0, Math.ceil(left / DAY));
  return {
    active: left > 0, expired: left <= 0, daysLeft,
    endsAt: new Date(end).toISOString(), startedAt: new Date(start).toISOString(),
    progress: Math.min(1, Math.max(0, (now - start) / (end - start))),
  };
}
