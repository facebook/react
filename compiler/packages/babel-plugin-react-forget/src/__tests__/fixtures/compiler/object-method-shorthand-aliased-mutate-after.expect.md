
## Input

```javascript
import { createHookWrapper, mutate, mutateAndReturn } from "shared-runtime";
function useHook({ value }) {
  const x = mutateAndReturn({ value });
  const obj = {
    getValue() {
      return value;
    },
  };
  mutate(x);
  return obj;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { createHookWrapper, mutate, mutateAndReturn } from "shared-runtime";
function useHook(t21) {
  const $ = useMemoCache(1);
  const { value } = t21;
  const x = mutateAndReturn({ value });
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {
      getValue() {
        return value;
      },
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const obj = t0;

  mutate(x);
  return obj;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getValue":{"kind":"Function","result":0}},"shouldInvokeFns":true}</div>