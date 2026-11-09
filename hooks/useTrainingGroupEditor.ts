import { useCallback, useRef, useState } from 'react';
import { useAlert } from '@/template';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { DISCIPLINES, updateTrainingGroup } from '@/services/trainingGroups';

// Reuses the existing shared-group operation and its synchronized refresh.
export function useTrainingGroupEditor(groupId: string) {
  const shared = useSharedGroups();
  const { showAlert } = useAlert();
  const { translate } = useLocalizedCopy();
  const [editName, setEditName] = useState<string | null>(null);
  const [editDiscipline, setEditDiscipline] = useState('all');
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  const saveGroup = useCallback(async () => {
    if (inFlight.current || shared.busy || editName === null) return;
    const name = editName.trim();
    const group = shared.data.groups.find(item => item.id === groupId);
    const coach = shared.data.members.some(item =>
      item.group_id === groupId && item.user_id === shared.userId && item.role === 'coach',
    );

    if (!shared.userId || !group || (!coach && group.owner_id !== shared.userId)) {
      showAlert(translate('Erreur'), translate('Vous ne disposez pas de cet accès.'));
      return;
    }
    if (!name || name.length > 120 || !DISCIPLINES.some(item => item.id === editDiscipline)) {
      showAlert(translate('Erreur'), translate('Opération impossible. Vérifiez les informations et votre connexion.'));
      return;
    }

    inFlight.current = true;
    setPending(true);
    try {
      await updateTrainingGroup(shared.operate, groupId, name, editDiscipline);
      setEditName(null);
    } catch (reason) {
      showAlert(
        translate('Erreur'),
        translate(reason instanceof Error ? reason.message : 'Opération impossible. Vérifiez les informations et votre connexion.'),
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }, [shared.busy, shared.userId, shared.data.groups, shared.data.members, shared.operate, groupId, editName, editDiscipline, showAlert, translate]);

  return {
    editName,
    setEditName,
    editDiscipline,
    setEditDiscipline,
    saving: pending || shared.busy,
    saveGroup,
  };
}
