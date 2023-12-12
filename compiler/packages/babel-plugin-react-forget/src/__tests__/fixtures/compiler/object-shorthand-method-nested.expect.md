
## Input

```javascript
import { useState } from "react";
import { createHookWrapper } from "shared-runtime";

function useHook({ value }) {
  const [state] = useState(false);

  return {
    getX() {
      return {
        a: [],
        getY() {
          return value;
        },
        state,
      };
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```

## Code

```javascript
import { useState, unstable_useMemoCache as useMemoCache } from "react";
import { createHookWrapper } from "shared-runtime";

function useHook(t21) {
  const $ = useMemoCache(3);
  const { value } = t21;
  const [state] = useState(false);
  let t0;
  if ($[0] !== value || $[1] !== state) {
    t0 = {
      getX() {
        return {
          a: [],
          getY() {
            return value;
          },
          state,
        };
      },
    };
    $[0] = value;
    $[1] = state;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getX":{"kind":"Function","result":{"a":[],"getY":{"kind":"Function","result":0},"state":false}}},"shouldInvokeFns":true}</div>