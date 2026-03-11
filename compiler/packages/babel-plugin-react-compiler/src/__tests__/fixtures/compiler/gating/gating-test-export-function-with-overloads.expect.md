
## Input

```javascript
// @gating
import {useState} from 'react';

type Session = {name: string};

export function useSession(): Session | null;
export function useSession<T>(selector: (session: Session) => T): T | null;
export function useSession<T>(
  selector?: (session: Session) => T
): Session | T | null {
  const [session] = useState<Session | null>(null);
  if (!session) return null;
  return selector ? selector(session) : session;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { isForgetEnabled_Fixtures } from "ReactForgetFeatureFlag"; // @gating
import { useState } from "react";

type Session = { name: string };

export function useSession(): Session | null;
export function useSession<T>(selector: (session: Session) => T): T | null;
export const useSession = isForgetEnabled_Fixtures()
  ? function useSession(selector) {
      const $ = _c(3);

      const [session] = useState(null);
      if (!session) {
        return null;
      }
      let t0;
      if ($[0] !== selector || $[1] !== session) {
        t0 = selector ? selector(session) : session;
        $[0] = selector;
        $[1] = session;
        $[2] = t0;
      } else {
        t0 = $[2];
      }
      return t0;
    }
  : function useSession(selector?: (session: Session) => T) {
      const [session] = useState<Session | null>(null);
      if (!session) return null;
      return selector ? selector(session) : session;
    };

```

