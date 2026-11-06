import { User } from '@/types';

export function joinProfileNames(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}

export function getProfileNames(user: Pick<User, 'name' | 'firstName' | 'lastName'>) {
  if (typeof user.firstName === 'string' && typeof user.lastName === 'string') {
    return { firstName: user.firstName, lastName: user.lastName };
  }
  // Legacy full-name profiles remain editable; new profiles retain compound given/family names separately.
  const parts = user.name.trim().split(/\s+/);
  return { firstName: parts.shift() ?? '', lastName: parts.join(' ') };
}

export function applyProfileUpdate(user: User, updates: Partial<User>): User {
  const next = { ...user, ...updates };
  if (updates.firstName !== undefined || updates.lastName !== undefined) {
    const previous = getProfileNames(user);
    const firstName = (updates.firstName ?? previous.firstName).trim();
    const lastName = (updates.lastName ?? previous.lastName).trim();
    return { ...next, firstName, lastName, name: joinProfileNames(firstName, lastName) || next.name };
  }
  if (updates.name !== undefined) {
    const names = getProfileNames({ name: updates.name });
    return { ...next, ...names };
  }
  return next;
}
