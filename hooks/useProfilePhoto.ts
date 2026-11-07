import { useCallback, useRef, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { selectProfilePhoto, type ProfilePhotoSource } from '@/services/profilePhotoService';
import { useI18n } from '@/hooks/useI18n';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';

export function useProfilePhoto(initialPhoto: string | null = null) {
  const [avatar, setAvatar] = useState<string | null>(initialPhoto);
  const [busy, setBusy] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const pickRef = useRef<(source: ProfilePhotoSource) => Promise<void>>(async () => {});
  const mounted = useRef(true);
  const { t } = useI18n();
  const { translate } = useLocalizedCopy();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  // Web (iPhone, Android, computer): the browser already offers Photo library / Take photo / Files,
  // so the system picker opens directly instead of showing a second menu first.
  const choose = useCallback(() => { if (pending.current) return; if (Platform.OS === 'web') { void pickRef.current('library'); return; } setSourceOpen(true); }, []);
  const closeSources = useCallback(() => setSourceOpen(false), []);
  const pick = useCallback(async (source: ProfilePhotoSource) => {
    if (pending.current) return;
    pending.current = true;
    setSourceOpen(false);
    setBusy(true); setError('');
    try {
      const photo = await selectProfilePhoto(source);
      if (mounted.current && photo) setAvatar(photo);
    } catch (reason) {
      if (mounted.current) {
        const code = reason instanceof Error ? reason.message : '';
        setError(code === 'camera_permission' ? translate('Autorisez l’accès à la caméra dans les réglages.') : code === 'photo_size' ? translate('Choisissez une image de moins de 10 Mo.') : t(code === 'photo_permission' ? 'photo_permission' : 'photo_error'));
      }
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }, [t, translate]);
  const remove = useCallback(() => { if (!pending.current) { setAvatar(null); setError(''); } }, []);
  pickRef.current = pick;
  return { avatar, busy, error, choose, remove, sourceOpen, closeSources, pick };
}
