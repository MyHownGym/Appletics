import { useCallback, useRef, useState, useEffect } from 'react';
import { selectProfilePhoto, type ProfilePhotoSource } from '@/services/profilePhotoService';
import { useI18n } from '@/hooks/useI18n';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';

export function useProfilePhoto(initialPhoto: string | null = null) {
  const [avatar, setAvatar] = useState<string | null>(initialPhoto);
  const [busy, setBusy] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  const { t } = useI18n();
  const { translate } = useLocalizedCopy();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const choose = useCallback(() => { if (!pending.current) setSourceOpen(true); }, []);
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
  return { avatar, busy, error, choose, remove, sourceOpen, closeSources, pick };
}
