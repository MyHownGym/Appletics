// SDK-independent dispatch adapter. It never reads, changes or fabricates a session.
export type AuthEventListener<Event, Session> = (event: Event, session: Session) => void | Promise<void>;
interface SubscriptionRegistration {
  data: { subscription: { unsubscribe: () => void } };
}

export function createDeferredAuthSubscription<Event, Session, Registration extends SubscriptionRegistration>(
  register: (listener: AuthEventListener<Event, Session>) => Registration,
  reportFailure: () => void,
): (listener: AuthEventListener<Event, Session>) => Registration {
  return listener => {
    let active = true;
    let queue: Promise<void> = Promise.resolve();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const registration = register((event, session) => {
      if (!active) return;
      // Supabase must receive a synchronous return, not the listener promise.
      // A microtask alone is insufficient: dispatch after the auth lock is released.
      const timer = setTimeout(() => {
        timers.delete(timer);
        queue = queue.then(async () => {
          if (!active) return;
          try { await listener(event, session); }
          catch {
            // Never include events, identities, tokens or provider responses in logs.
            try { reportFailure(); } catch { /* Preserve the queue after a reporter failure. */ }
          }
        });
      }, 0);
      timers.add(timer);
    });
    const unsubscribe = registration.data.subscription.unsubscribe.bind(registration.data.subscription);
    registration.data.subscription.unsubscribe = () => {
      if (!active) return;
      active = false;
      timers.forEach(clearTimeout);
      timers.clear();
      unsubscribe();
    };
    return registration;
  };
}
