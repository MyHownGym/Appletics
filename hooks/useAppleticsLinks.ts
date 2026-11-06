
import { useCallback } from 'react';
import { useExternalLinks } from '@/hooks/useExternalLinks';
import { appleticsLinks } from '@/constants/links';

export function useAppleticsLinks() {
  const { openLink } = useExternalLinks();
  const open = useCallback((url: string) => { void openLink(url); }, [openLink]);
  return {
    openWebsite: useCallback(() => open(appleticsLinks.website), [open]),
    openInstagram: useCallback(() => open(appleticsLinks.instagram), [open]),
    openEmail: useCallback(() => open(appleticsLinks.email), [open]),
  };
}
