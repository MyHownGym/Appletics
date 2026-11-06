import { useCallback, useMemo } from 'react';
import { Children, ReactNode } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { translateUiText } from '@/services/localizationService';
export function useLocalizedCopy(children?: ReactNode) {
  const { language } = useI18n();
  const translate = useCallback((text: string) => translateUiText(text, language), [language]);
  const content = useMemo(() => {
    const nodes = Children.toArray(children);
    if (nodes.every(node => typeof node === 'string' || typeof node === 'number')) {
      const joined = nodes.join('');
      const localized = translate(joined);
      if (localized !== joined) return localized;
    }
    return nodes.map(node => typeof node === 'string' ? translate(node) : node);
  }, [children, translate]);
  return { content, translate };
}
