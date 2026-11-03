import { useState } from 'react';
import { Athlete } from '@/types';
import { useApp } from '@/hooks/useApp';
import { useLocalizedAlert as useAlert } from '@/hooks/useLocalizedAlert';
import { useSubscriptionQuota } from '@/hooks/useSubscriptionQuota';
import { normalizeEvent, parsePerf } from '@/services/athletePerformanceService';

export function useAthleteForm(id?: string) {
  const { athletes, addAthlete, updateAthlete, user } = useApp();
  const { showAlert } = useAlert();
  const ensureQuota = useSubscriptionQuota();
  const existing = athletes.find(athlete => athlete.id === id);
  const canEdit = user.userType !== 'athlete' && !user.isClubAdmin;
  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [birthYear, setBirthYear] = useState(existing?.birthYear ? String(existing.birthYear) : '');
  const [club, setClub] = useState(existing?.club ?? '');
  const [licenseNumber, setLicenseNumber] = useState(existing?.licenseNumber ?? '');
  const [avatar, setAvatar] = useState(existing?.avatar ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [eventsText, setEventsText] = useState(existing?.events.join(', ') ?? '');
  const [group, setGroup] = useState(existing?.group === 'middle_distance' ? 'distance' : existing?.group ?? 'sprints');
  const [status, setStatus] = useState<Athlete['status']>(existing?.status ?? 'active');
  const [pbs, setPbs] = useState<{ event: string; perf: string }[]>(Object.entries(existing?.pb ?? {}).map(([event, perf]) => ({ event, perf })));
  const [pbEvent, setPbEvent] = useState('');
  const [pbPerf, setPbPerf] = useState('');

  const handleAddPb = () => {
    if (!pbEvent.trim() || !pbPerf.trim()) return;
    if (parsePerf(pbPerf) === null) {
      showAlert('Performance invalide', 'Utilisez un chrono (11.42, 2:08.34) ou une distance (6.25m).');
      return;
    }
    setPbs(previous => [...previous.filter(pb => normalizeEvent(pb.event) !== normalizeEvent(pbEvent)), { event: pbEvent.trim(), perf: pbPerf.trim() }]);
    setPbEvent('');
    setPbPerf('');
  };

  const save = (): boolean => {
    if (!canEdit) { showAlert('Lecture seule', 'Seul un coach peut modifier cette fiche.'); return false; }
    if (!existing && !ensureQuota('athletes', athletes.length)) return false;
    if (id && !existing) { showAlert('Athlète introuvable', 'Cette fiche ne peut plus être modifiée.'); return false; }
    if (!name.trim()) { showAlert('Nom requis', 'Indiquez le nom complet.'); return false; }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { showAlert('E-mail invalide', 'Vérifiez votre adresse e-mail.'); return false; }
    if (birthYear && (!/^\d{4}$/.test(birthYear) || Number(birthYear) < 1900 || Number(birthYear) > new Date().getFullYear())) { showAlert('Année invalide', 'Indiquez une année de naissance valide.'); return false; }
    if (avatar.trim() && !/^https?:\/\//i.test(avatar.trim())) { showAlert('Photo invalide', 'Utilisez une adresse de photo commençant par https://.'); return false; }
    const entries = [...pbs];
    if (pbEvent.trim() || pbPerf.trim()) entries.push({ event: pbEvent.trim(), perf: pbPerf.trim() });
    if (entries.some(pb => !pb.event.trim() || parsePerf(pb.perf) === null)) { showAlert('PB incomplet', 'Chaque record doit contenir une épreuve et une performance valide.'); return false; }
    const keys = entries.map(pb => normalizeEvent(pb.event));
    if (new Set(keys).size !== keys.length) { showAlert('Épreuve en double', 'Conservez un seul PB par épreuve.'); return false; }
    const manualPb: Record<string, string> = {};
    entries.forEach(pb => {
      const event = pb.event.trim();
      const originalKey = Object.keys(existing?.pb ?? {}).find(key => normalizeEvent(key) === normalizeEvent(event));
      const manualKey = Object.keys(existing?.manualPb ?? existing?.pb ?? {}).find(key => normalizeEvent(key) === normalizeEvent(event));
      // Unchanged calculated records are not copied into the manual baseline.
      if (originalKey && existing?.pb[originalKey] === pb.perf.trim() && existing?.manualPb) {
        if (manualKey) manualPb[event] = existing.manualPb[manualKey];
      } else manualPb[event] = pb.perf.trim();
    });
    const athlete: Athlete = {
      ...existing, id: existing?.id ?? `a-${Date.now()}`, name: name.trim(),
      email: email.trim(), phone: phone.trim(), birthYear: birthYear ? Number(birthYear) : undefined,
      club: club.trim(), licenseNumber: licenseNumber.trim(), avatar: avatar.trim(), notes: notes.trim(),
      events: [...new Set(eventsText.split(',').map(event => event.trim()).filter(Boolean))],
      group, status, pb: manualPb, manualPb,
    };
    if (existing) updateAthlete(athlete); else addAthlete(athlete);
    return true;
  };
  return { existing, canEdit, name, setName, email, setEmail, phone, setPhone, birthYear, setBirthYear, club, setClub, licenseNumber, setLicenseNumber, avatar, setAvatar, notes, setNotes, eventsText, setEventsText, group, setGroup, status, setStatus, pbs, setPbs, pbEvent, setPbEvent, pbPerf, setPbPerf, handleAddPb, save };
}
