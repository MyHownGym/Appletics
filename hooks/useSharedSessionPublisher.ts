import { useCallback, useState } from 'react';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import type { TrainingSession } from '@/types';
export function useSharedSessionPublisher(groupId: string, sourceSession?: TrainingSession, sourceKey?: string) {
 const shared = useSharedGroups();
 const [title,setTitle] = useState(sourceSession?.title ?? '');
 const [date,setDate] = useState(sourceSession?.sessionDate ?? new Date().toISOString().slice(0,10));
 const [details,setDetails] = useState(sourceSession?.details ?? '');
 const [message,setMessage] = useState('');
 const publish = useCallback(async () => {
  if (!title.trim() || shared.busy) return;
  setMessage('');
  try { const id = await shared.operate<string>('shared_publish_session', { p_group: groupId, p_title: title.trim(), p_date: date, p_details: details.trim(), p_source: sourceKey ?? null }); setMessage('Enregistré dans le groupe.'); return id; }
  catch { return undefined; }
 }, [title,date,details,groupId,sourceKey,shared.operate,shared.busy]);
 return { title,setTitle,date,setDate,details,setDetails,publish,message,busy: shared.busy };
}
