import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/template';
import type { Athlete, TrainingPlan, TrainingSession, Competition, CompResult, ChatChannel, ChatMessage, User, NotifSettings, SessionPerformance } from '@/types';
import type { SubscriptionTier } from '@/constants/subscription';
import { useLocalizedAlert } from '@/hooks/useLocalizedAlert';
import { useBilling } from '@/hooks/useBilling';
import { useLocalDate } from '@/hooks/useLocalDate';
import { reconcileAthletes, resultWithPb, resultScore } from '@/services/athletePerformanceService';
import { withAutomaticCompetitionStatus } from '@/services/competitionStatusService';
import { normalizeGroupId } from '@/services/disciplineService';
import { applyProfileUpdate } from '@/services/profileNameService';
import { loadAccountProfile, saveAccountProfile } from '@/services/accountProfileService';
import { eraseCloudAccount, clearDeletedAccountSession } from '@/services/accountDeletionService';
import { clearAccountClubCoaches } from '@/services/clubCoachService';
import { cancelAccountDeviceNotifications } from '@/services/deviceCleanupService';
import { withStartupDeadline } from '@/services/startupService';
import { emptyLocalWorkspace, loadLocalWorkspace, saveLocalWorkspace, claimLegacyWorkspace, clearLocalWorkspace, type LocalWorkspace } from '@/services/localWorkspaceService';
const onboardingKey = '@appletics_onboarding_done';
const legacyUserKey = '@appletics_user';
const localProfileKey = (id: string) => `@appletics_profile_v2:${id}`;
const emptyUser: User = { id: '', name: '', firstName: '', lastName: '', email: '', role: 'Head Coach', club: '', avatar: null, userType: 'coach', accountType: 'indie', biometricEnabled: false };
const defaultNotifications: NotifSettings = { notif_new_plan: true, notif_session_reminder: true, notif_plan_updated: true, notif_new_competition: true, notif_competition_reminder: true, notif_result_posted: true, notif_new_message: true, notif_athlete_added: false, notif_weekly_summary: true };
interface AppContextType {
 user: User; athletes: Athlete[]; trainingPlans: TrainingPlan[]; competitions: Competition[]; results: CompResult[]; channels: ChatChannel[]; messages: Record<string,ChatMessage[]>; sessionPerformances: SessionPerformance[];
 onboardingDone: boolean; onboardingLoading: boolean; accountProfileLoading: boolean; startupError: string; startupAwaitingConsent: boolean; isLocked: boolean; subscription: SubscriptionTier; notifSettings: NotifSettings;
 setOnboardingDone: (done: boolean) => void; setSubscription: (tier: SubscriptionTier) => void; setLocked: (locked: boolean) => void; setNotifSettings: (settings: NotifSettings) => void;
 addTrainingPlan: (plan: TrainingPlan) => void; updateTrainingPlan: (plan: TrainingPlan) => void; deleteTrainingPlan: (id: string) => void;
 addSession: (planId: string,session: TrainingSession) => void; updateSession: (planId: string,session: TrainingSession) => void; deleteSession: (planId: string,id: string) => void;
 addSessionPerformance: (performance: SessionPerformance) => void; deleteSessionPerformance: (id: string) => void;
 addCompetition: (competition: Competition) => void; updateCompetition: (competition: Competition) => void; deleteCompetition: (id: string) => void;
 addResult: (result: CompResult) => void; updateResult: (result: CompResult) => void;
 addAthlete: (athlete: Athlete) => void; updateAthlete: (athlete: Athlete) => void; deleteAthlete: (id: string) => void;
 addChannel: (channel: ChatChannel) => void; updateChannel: (channel: ChatChannel) => void; deleteChannel: (id: string) => void;
 sendMessage: (channelId: string,text: string) => void; markChannelRead: (id: string) => void;
 updateUser: (updates: Partial<User>) => void; deleteAccount: (password: string) => Promise<void>;
}
export const AppContext = createContext<AppContextType | undefined>(undefined);
export function AppProvider({ children }: { children: ReactNode }) {
 const auth = useAuth(); const billing = useBilling(); const { showAlert } = useLocalizedAlert(); const today = useLocalDate();
 const [user,setUser] = useState<User>(emptyUser);
 const [stored,setStored] = useState<{ owner: string; data: LocalWorkspace }>({ owner: '',data: emptyLocalWorkspace() });
 const [onboardingDone,setDone] = useState(false);
 const [onboardingLoading,setOnboardingLoading] = useState(true);
 const [readyFor,setReadyFor] = useState('');
 const [isLocked,setLocked] = useState(true);
 const [notifSettings,setNotifications] = useState<NotifSettings>(defaultNotifications);
 const [startupError,setStartupError] = useState('');
 const [startupAwaitingConsent,setStartupAwaitingConsent] = useState(false);
 const bootstrapReadFailed = useRef(false);
 const userRef = useRef(user); userRef.current = user;
 const authId = auth.user?.id ?? '';
 const identity = useRef(authId); identity.current = authId;
 const deleting = useRef(false);
 const accountProfileLoading = auth.loading || (!!authId && readyFor !== authId);
 // Derive an empty view immediately on logout/account change, before asynchronous effects.
 const data = stored.owner === authId && authId ? stored.data : emptyLocalWorkspace();
 const athletes = useMemo(() => data.athletes.map(item => ({ ...item,group: normalizeGroupId(item.group) })),[data.athletes]);
 const trainingPlans = useMemo(() => data.trainingPlans.map(item => ({ ...item,group: normalizeGroupId(item.group) })),[data.trainingPlans]);
 const competitions = useMemo(() => data.competitions.map(item => withAutomaticCompetitionStatus(item,today)),[data.competitions,today]);
 const subscription: SubscriptionTier = billing.state.subscribed && billing.state.tier ? billing.state.tier : 'basic';
 useEffect(() => {
  let cancelled = false;
  void withStartupDeadline(Promise.all([AsyncStorage.getItem(onboardingKey),AsyncStorage.getItem(legacyUserKey)]), 'La lecture des réglages de cet appareil prend trop de temps. Réessayez sans supprimer l’app.').then(([done,saved]) => {
   if (cancelled) return;
   setDone(done === 'true');
   if (saved) { try { const profile = JSON.parse(saved); setUser({ ...emptyUser,...profile }); } catch {} }
  }).catch(reason => {
   if (!cancelled) { bootstrapReadFailed.current = true; setStartupError(reason instanceof Error ? reason.message : 'Impossible de lire les réglages de cet appareil. Aucune donnée n’a été effacée.'); }
  }).finally(() => { if (!cancelled) setOnboardingLoading(false); });
  return () => { cancelled = true; };
 },[]);
 useEffect(() => {
  if (onboardingLoading || auth.loading || bootstrapReadFailed.current) return;
  let cancelled = false;
  setStartupError('');
  setStartupAwaitingConsent(false);
  if (!auth.user) { setReadyFor(''); setLocked(true); setStored({ owner:'',data:emptyLocalWorkspace() }); return; }
  const account = auth.user;
  const restore = async () => {
   const [profile,localProfile,workspace,notifications] = await withStartupDeadline(
    Promise.all([loadAccountProfile(account.id),AsyncStorage.getItem(localProfileKey(account.id)),loadLocalWorkspace(account.id),AsyncStorage.getItem(`@appletics_notif:${account.id}`)]),
    'La restauration du compte prend trop de temps. Vérifiez votre connexion, puis réessayez. Votre historique local est conservé.',
   );
   if (cancelled) return;
   let local: Partial<User> = {};
   if (localProfile) { try { local = JSON.parse(localProfile); } catch {} }
   else if (userRef.current.id === account.id) local = userRef.current;
   let workspaceData = workspace.data;
   if (workspace.legacy) {
    // Device-local history has no verifiable cloud owner. Ask before assigning it; never publish it automatically.
    setStartupAwaitingConsent(true);
    const adopt = await new Promise<boolean>(resolve => showAlert('Données de cet appareil', 'Rattacher votre historique local à ce compte ? Il restera privé sur cet appareil jusqu’à un partage explicite.', [
     { text:'Commencer sans importer',style:'cancel',onPress:() => resolve(false) },
     { text:'Conserver mon historique',onPress:() => resolve(true) },
    ]));
    if (cancelled) return;
    setStartupAwaitingConsent(false);
    await claimLegacyWorkspace(account.id);
    if (adopt) workspaceData = { ...emptyLocalWorkspace(),...workspace.legacy };
   }
   workspaceData = { ...workspaceData,athletes:reconcileAthletes(workspaceData.athletes,workspaceData.results) };
   // Commit only after every read succeeds. The persistence effect saves once ready;
   // a failed/timed-out/cancelled restore must never save an empty replacement.
   if (cancelled) return;
   setStored({ owner:account.id,data:workspaceData });
   if (profile) {
    setUser(applyProfileUpdate(emptyUser,{ ...profile,id:account.id,email:account.email,avatar:local.avatar ?? profile.avatar ?? null,biometricEnabled:local.biometricEnabled ?? false }));
    setDone(true);
   } else {
    setUser({ ...emptyUser,id:account.id,email:account.email });
    setDone(false);
   }
   if (cancelled) return;
   if (notifications) { try { setNotifications(JSON.parse(notifications)); } catch { setNotifications(defaultNotifications); } }
   else setNotifications(defaultNotifications);
   setReadyFor(account.id);
  };
  void restore().catch(reason => {
   if (!cancelled) {
    setStartupAwaitingConsent(false);
    setStartupError(reason instanceof Error ? reason.message : 'Impossible de restaurer votre compte ou vos données. Aucun historique existant n’a été remplacé.');
   }
  });
  return () => { cancelled = true; };
 },[authId,auth.loading,onboardingLoading]);
 useEffect(() => {
  if (deleting.current || !authId || readyFor !== authId || stored.owner !== authId) return;
  void saveLocalWorkspace(authId,stored.data).catch(() => showAlert('Enregistrement local','Les changements restent visibles, mais leur sauvegarde sur cet appareil a échoué.'));
 },[stored,authId,readyFor]);
 const change = useCallback((transform: (previous:LocalWorkspace) => LocalWorkspace) => {
  const owner = identity.current;
  if (!owner || deleting.current) return;
  setStored(previous => previous.owner === owner ? { owner,data:transform(previous.data) } : previous);
 },[]);
 const setOnboardingDone = useCallback((done:boolean) => { setDone(done); void AsyncStorage.setItem(onboardingKey,String(done)); },[]);
 const setSubscription = useCallback((_tier:SubscriptionTier) => {},[]);
 const setNotifSettings = useCallback((settings:NotifSettings) => { setNotifications(settings); if (identity.current) void AsyncStorage.setItem(`@appletics_notif:${identity.current}`,JSON.stringify(settings)); },[]);
 const addTrainingPlan = useCallback((plan:TrainingPlan) => change(previous => ({ ...previous,trainingPlans:[plan,...previous.trainingPlans] })),[change]);
 const updateTrainingPlan = useCallback((plan:TrainingPlan) => change(previous => ({ ...previous,trainingPlans:previous.trainingPlans.map(item => item.id === plan.id ? plan : item) })),[change]);
 const deleteTrainingPlan = useCallback((id:string) => change(previous => ({ ...previous,trainingPlans:previous.trainingPlans.filter(item => item.id !== id) })),[change]);
 const addSession = useCallback((planId:string,session:TrainingSession) => change(previous => ({ ...previous,trainingPlans:previous.trainingPlans.map(item => item.id === planId ? { ...item,sessions:[...item.sessions,session] } : item) })),[change]);
 const updateSession = useCallback((planId:string,session:TrainingSession) => change(previous => ({ ...previous,trainingPlans:previous.trainingPlans.map(item => item.id === planId ? { ...item,sessions:item.sessions.map(row => row.id === session.id ? session : row) } : item) })),[change]);
 const deleteSession = useCallback((planId:string,id:string) => change(previous => ({ ...previous,trainingPlans:previous.trainingPlans.map(item => item.id === planId ? { ...item,sessions:item.sessions.filter(row => row.id !== id) } : item) })),[change]);
 const addSessionPerformance = useCallback((performance:SessionPerformance) => change(previous => ({ ...previous,sessionPerformances:[performance,...previous.sessionPerformances.filter(item => !(item.sessionId === performance.sessionId && item.athleteId === performance.athleteId))] })),[change]);
 const deleteSessionPerformance = useCallback((id:string) => change(previous => ({ ...previous,sessionPerformances:previous.sessionPerformances.filter(item => item.id !== id) })),[change]);
 const addCompetition = useCallback((competition:Competition) => change(previous => ({ ...previous,competitions:[withAutomaticCompetitionStatus(competition),...previous.competitions] })),[change]);
 const updateCompetition = useCallback((competition:Competition) => change(previous => ({ ...previous,competitions:previous.competitions.map(item => item.id === competition.id ? withAutomaticCompetitionStatus(competition) : item) })),[change]);
 const deleteCompetition = useCallback((id:string) => change(previous => {
  const results = previous.results.filter(item => item.competitionId !== id);
  return { ...previous,results,athletes:reconcileAthletes(previous.athletes,results),competitions:previous.competitions.filter(item => item.id !== id) };
 }),[change]);
 const storeResult = useCallback((result:CompResult,editing:boolean) => change(previous => {
  const old = previous.results.find(item => item.id === result.id);
  if (editing && !old) return previous;
  const next = resultWithPb(result,previous.athletes,previous.results);
  const results = old ? previous.results.map(item => item.id === next.id ? next : item) : [next,...previous.results];
  const competitions = previous.competitions.map(item => {
   if (item.id !== next.competitionId && item.id !== old?.competitionId) return item;
   return { ...item,teamScore:Math.max(0,(item.teamScore ?? 0)-(old?.competitionId === item.id ? resultScore(old.rank) : 0)+(next.competitionId === item.id ? resultScore(next.rank) : 0)),athleteIds:item.id === next.competitionId && !item.athleteIds.includes(next.athleteId) ? [...item.athleteIds,next.athleteId] : item.athleteIds };
  });
  return { ...previous,results,competitions,athletes:reconcileAthletes(previous.athletes,results) };
 }),[change]);
 const addResult = useCallback((result:CompResult) => storeResult(result,false),[storeResult]);
 const updateResult = useCallback((result:CompResult) => storeResult(result,true),[storeResult]);
 const addAthlete = useCallback((athlete:Athlete) => change(previous => ({ ...previous,athletes:reconcileAthletes([athlete,...previous.athletes],previous.results) })),[change]);
 const updateAthlete = useCallback((athlete:Athlete) => change(previous => ({ ...previous,athletes:reconcileAthletes(previous.athletes.map(item => item.id === athlete.id ? athlete : item),previous.results),channels:previous.channels.map(item => ({ ...item,members:item.members.map(member => member.id === athlete.id ? { ...member,name:athlete.name } : member) })),sessionPerformances:previous.sessionPerformances.map(item => item.athleteId === athlete.id ? { ...item,athleteName:athlete.name } : item) })),[change]);
 const deleteAthlete = useCallback((id:string) => change(previous => ({ ...previous,athletes:previous.athletes.filter(item => item.id !== id) })),[change]);
 const addChannel = useCallback((channel:ChatChannel) => change(previous => ({ ...previous,channels:[channel,...previous.channels],messages:{ ...previous.messages,[channel.id]:[] } })),[change]);
 const updateChannel = useCallback((channel:ChatChannel) => change(previous => ({ ...previous,channels:previous.channels.map(item => item.id === channel.id ? channel : item) })),[change]);
 const deleteChannel = useCallback((id:string) => change(previous => { const messages = { ...previous.messages }; delete messages[id]; return { ...previous,messages,channels:previous.channels.filter(item => item.id !== id) }; }),[change]);
 const sendMessage = useCallback((id:string,text:string) => change(previous => {
  const profile = userRef.current;
  const message:ChatMessage = { id:`msg-${Date.now()}`,senderId:profile.id,senderName:profile.name,text,time:new Date().toLocaleTimeString([],{ hour:'2-digit',minute:'2-digit' }),isOwn:true };
  return { ...previous,messages:{ ...previous.messages,[id]:[...(previous.messages[id] ?? []),message] },channels:previous.channels.map(item => item.id === id ? { ...item,lastMessage:text,lastTime:'Just now',unread:0 } : item) };
 }),[change]);
 const markChannelRead = useCallback((id:string) => change(previous => ({ ...previous,channels:previous.channels.map(item => item.id === id ? { ...item,unread:0 } : item) })),[change]);
 const updateUser = useCallback((updates:Partial<User>) => {
  if (deleting.current) return;
  const next = applyProfileUpdate(userRef.current,{ ...updates,...(auth.user ? { id:auth.user.id,email:auth.user.email } : {}) });
  userRef.current = next; setUser(next);
  const { pin:_pin,...safeLocal } = next;
  void AsyncStorage.setItem(auth.user ? localProfileKey(auth.user.id) : legacyUserKey,JSON.stringify(safeLocal));
  if (auth.user && next.firstName?.trim()) void saveAccountProfile(next).catch(reason => showAlert('Compte sécurisé',reason instanceof Error ? reason.message : 'Impossible de sauvegarder le profil. Réessayez.'));
 },[auth.user,showAlert]);
 const deleteAccount = useCallback(async (password:string) => {
  const owner = identity.current;
  if (!owner) throw new Error('Reconnectez-vous avant de supprimer votre compte.');
  if (deleting.current) return;
  deleting.current = true;
  try {
   await eraseCloudAccount(password);
   // Never erase the local history before receiving an explicit server confirmation.
   setReadyFor(''); setStored({ owner:'',data:emptyLocalWorkspace() });
   userRef.current = emptyUser; setUser(emptyUser); setDone(false); setLocked(true);
   const cleanup = await Promise.allSettled([
    clearLocalWorkspace(owner),
    AsyncStorage.multiRemove([localProfileKey(owner), `@appletics_notif:${owner}`, onboardingKey]),
    clearAccountClubCoaches(owner), cancelAccountDeviceNotifications(),
   ]);
   await clearDeletedAccountSession();
   if (cleanup.some(result => result.status === 'rejected')) showAlert('Compte supprimé','Le compte Cloud est supprimé. Une partie du nettoyage sur cet appareil a échoué ; fermez l’app et effacez ses données locales si nécessaire.');
  } finally { deleting.current = false; }
 },[showAlert]);
 return <AppContext.Provider value={{ user,athletes,trainingPlans,competitions,results:data.results,channels:data.channels,messages:data.messages,sessionPerformances:data.sessionPerformances,onboardingDone,onboardingLoading,accountProfileLoading,startupError,startupAwaitingConsent,isLocked,subscription,notifSettings,setOnboardingDone,setSubscription,setLocked,setNotifSettings,addTrainingPlan,updateTrainingPlan,deleteTrainingPlan,addSession,updateSession,deleteSession,addSessionPerformance,deleteSessionPerformance,addCompetition,updateCompetition,deleteCompetition,addResult,updateResult,addAthlete,updateAthlete,deleteAthlete,addChannel,updateChannel,deleteChannel,sendMessage,markChannelRead,updateUser,deleteAccount }}>{children}</AppContext.Provider>;
}
