import { useCallback, useRef, useState } from 'react';
import { useAlert } from '@/template';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { useLocalizedCopy } from '@/hooks/useLocalizedCopy';
import { updateTrainingGroup } from '@/services/trainingGroups';

export function useTrainingGroupEditor(groupId: string) {
  const shared = useSharedGroups();
  const { showAlert } = useAlert();
  const { translate } = useLocalizedCopy();
  const [editName, setEditName] = useState<string | null>(null);
  const [editDiscipline, setEditDiscipline] = useState('all');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  const saveGroup = useCallback(async () => {
    if (pending.current || shared.busy || !editName?.trim()) return;
    const group = shared.data.groups.find(item => item.id === groupId);
    const coach = shared.data.members.some(item => item.group_id === groupId && item.user_id === shared.userId && item.role === 'coach');
    if (!group || !coach) return;
    pending.current = true;
    setSaving(true);
    try {
      // The shared operation already refreshes the cross-page snapshot after a successful RPC.
      await updateTrainingGroup(shared.operate, groupId, editName, editDiscipline);
      setEditName(null);
      showAlert(translate('Groupe enregistré'), translate('Les coachs et athlètes du groupe voient le nouveau nom.'));
    } catch (reason) {
      showAlert(translate('Modification impossible'), translate(reason instanceof Error ? reason.message : 'Opération impossible. Vérifiez les informations et votre connexion.'));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }, [shared.busy, shared.data.groups, shared.data.members, shared.userId, shared.operate, groupId, editName, editDiscipline, showAlert, translate]);

  return { editName, setEditName, editDiscipline, setEditDiscipline, saving: saving || shared.busy, saveGroup };
}
