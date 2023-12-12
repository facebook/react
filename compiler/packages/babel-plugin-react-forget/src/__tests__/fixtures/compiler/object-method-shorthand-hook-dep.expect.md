
## Input

```javascript
import { createHookWrapper } from "shared-runtime";
import { useState } from "react";
function useFoo() {
  const [state, _setState] = useState(false);
  return {
    func() {
      return state;
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useFoo),
  params: [{}],
};

```

## Code

```javascript
import { createHookWrapper } from "shared-runtime";
import { useState, unstable_useMemoCache as useMemoCache } from "react";
function useFoo() {
  const $ = useMemoCache(1);
  const [state] = useState(false);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      func() {
        return state;
      },
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useFoo),
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"func":{"kind":"Function","result":false}},"shouldInvokeFns":true}</div>