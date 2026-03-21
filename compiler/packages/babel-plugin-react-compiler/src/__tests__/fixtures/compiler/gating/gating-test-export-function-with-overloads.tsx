// @gating
import {useState} from 'react';

type Session = {name: string};

export function useSession(): Session | null;
export function useSession<T>(selector: (session: Session) => T): T | null;
export function useSession<T>(
  selector?: (session: Session) => T,
): Session | T | null {
  const [session] = useState<Session | null>(null);
  if (!session) return null;
  return selector ? selector(session) : session;
}
