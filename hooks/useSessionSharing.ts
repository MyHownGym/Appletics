import { useMemo, useState } from 'react';
import { useSharedGroups } from '@/hooks/useSharedGroups';
export function useSessionSharing(planId: string, sessionId: string) {
 const shared = useSharedGroups();
 const [groupId,setGroupId] = useState('');
 const [selectedSession,setSelectedSession] = useState('');
 const sourceKey = `${shared.userId}:${planId}:${sessionId}`;
 const groups = shared.data.groups;
 const selectedGroup = groups.find(item => item.id === groupId) ?? groups[0];
 const sessions = useMemo(() => shared.data.sessions.filter(item => item.group_id === selectedGroup?.id), [shared.data.sessions, selectedGroup?.id]);
 const matched = sessions.find(item => item.source_key === sourceKey);
 const session = sessions.find(item => item.id === selectedSession) ?? matched;
 const coach = shared.data.members.some(item => item.group_id === selectedGroup?.id && item.user_id === shared.userId && item.role === 'coach');
 return { ...shared, groups, selectedGroup, setGroupId, sessions, session, setSelectedSession, sourceKey, coach };
}
