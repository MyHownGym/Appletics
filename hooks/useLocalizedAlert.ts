import { useCallback } from 'react';
import { useAlert } from '@/template';
import { useI18n } from '@/hooks/useI18n';
export function useLocalizedAlert() {
  const { showAlert: display } = useAlert();
  const { t } = useI18n();
  const showAlert = useCallback((title: string, message?: string, buttons?: Parameters<typeof display>[2]) => {
    display(t(title), message ? t(message) : message, buttons?.map(button => ({ ...button, text: t(button.text) })));
  }, [display, t]);
  return { showAlert };
}
