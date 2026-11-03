import { Athlete, ChatChannel, Competition, CompResult, TrainingPlan, User } from '@/types';

interface ActivityScopeInput {
  user: User;
  athletes: Athlete[];
  trainingPlans: TrainingPlan[];
  competitions: Competition[];
  channels: ChatChannel[];
  results: CompResult[];
}

export function getActivityScope(input: ActivityScopeInput) {
  const { user, athletes, trainingPlans, competitions, channels, results } = input;
  if (user.userType !== 'athlete') return { trainingPlans, competitions, channels, results, athlete: null };
  // Retain the existing local record matching rules; never expose a staff chat through the shared preview user ID.
  const email = user.email.trim().toLowerCase();
  const athlete = athletes.find(item => item.id === user.id)
    ?? (email ? athletes.find(item => item.email?.trim().toLowerCase() === email) : undefined)
    ?? athletes.find(item => item.name.trim().toLowerCase() === user.name.trim().toLowerCase());
  const athleteIds = new Set([...(athlete ? [athlete.id] : [])]);
  const athleteResults = results.filter(result => athleteIds.has(result.athleteId));
  const recordedCompetitions = new Set(athleteResults.map(result => result.competitionId));
  return {
    athlete: athlete ?? null,
    trainingPlans: trainingPlans.filter(plan => plan.athleteIds.some(id => athleteIds.has(id) || id === user.id)),
    competitions: competitions.filter(competition => recordedCompetitions.has(competition.id) || competition.athleteIds.some(id => athleteIds.has(id) || id === user.id)),
    channels: channels.filter(channel => channel.type === 'group' && channel.members.some(member => member.role === 'athlete' && (athleteIds.has(member.id) || member.id === user.id))),
    results: athleteResults,
  };
}
