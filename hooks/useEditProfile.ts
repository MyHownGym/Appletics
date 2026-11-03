import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAlert, useAuth } from '@/template';
import { useApp } from '@/hooks/useApp';
import { useActivityScope } from '@/hooks/useActivityScope';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useI18n } from '@/hooks/useI18n';
import { useCoachRoles } from '@/hooks/useCoachRoles';
import { useCoachAthleteCount } from '@/hooks/useCoachAthleteCount';
import { normalizeCoachRole } from '@/services/coachRoleService';
import { onboardingCopy } from '@/constants/onboarding';
import { clubRoleLabels } from '@/constants/club';
import { Colors } from '@/constants/theme';
import { getProfileNames, joinProfileNames } from '@/services/profileNameService';

export function useEditProfile() {
  const { user, updateUser, updateAthlete } = useApp();
  const auth = useAuth();
  const { athlete } = useActivityScope();
  const router = useRouter();
  const { showAlert } = useAlert();
  const { t, language } = useI18n();
  const { roles: coachRoleOptions } = useCoachRoles();
  const athleteCount = useCoachAthleteCount(user.coachAthleteCount);
  const legacyPlaceholder = !auth.user && ['Athlète', 'Athlete', 'Entraîneur en chef', 'Head Coach', 'Administrateur Club'].includes(user.name);
  const initialNames = legacyPlaceholder ? { firstName: '', lastName: '' } : getProfileNames(user);
  const [firstName, setFirstName] = useState(initialNames.firstName);
  const [lastName, setLastName] = useState(initialNames.lastName);
  const [club, setClub] = useState(user.club);
  const [email, setEmail] = useState(auth.user?.email ?? user.email);
  const [role, setRole] = useState(user.accountType === 'club' ? user.role : normalizeCoachRole(user.role));
  const photo = useProfilePhoto(user.avatar);
  const isClub = user.accountType === 'club';
  const isAthlete = user.userType === 'athlete';
  const roles = isClub ? Object.entries(clubRoleLabels).map(([id, label]) => ({ id, label: t(label) }))
    : isAthlete ? [] : coachRoleOptions;
  const save = useCallback(() => {
    if (photo.busy) return;
    if (!firstName.trim()) {
      showAlert(t('error'), `${t('first_name')} : ${t('required')}`);
      return;
    }
    if (!isClub && !isAthlete && !athleteCount.valid) {
      showAlert(t('error'), onboardingCopy[language].countError);
      return;
    }
    const name = joinProfileNames(firstName, lastName);
    updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), name, club: club.trim(), email: email.trim(), role, avatar: photo.avatar,
      ...(!isClub && !isAthlete ? { coachAthleteCount: athleteCount.value } : {}) });
    // Keep the already-linked athlete record and its assignments intact when personal details change.
    if (isAthlete && athlete) updateAthlete({ ...athlete, name, club: club.trim(), email: email.trim(), avatar: photo.avatar ?? undefined });
    router.back();
  }, [photo.busy, photo.avatar, firstName, lastName, club, email, role, updateUser, updateAthlete, isAthlete, isClub, athlete, athleteCount.valid, athleteCount.value, language, router, showAlert, t]);
  return { firstName, setFirstName, lastName, setLastName, club, setClub, email, setEmail, role, setRole, roles, photo, isClub, isAthlete, athleteCount, save,
    emailReadOnly: !!auth.user,
    accentColor: isClub ? Colors.club : isAthlete ? Colors.info : Colors.primary };
}
