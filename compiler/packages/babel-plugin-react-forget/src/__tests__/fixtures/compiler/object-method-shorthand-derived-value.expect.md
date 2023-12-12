
## Input

```javascript
import { createHookWrapper, mutateAndReturn } from "shared-runtime";
function useHook({ value }) {
  const x = mutateAndReturn({ value });
  const obj = {
    getValue() {
      return x;
    },
  };
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
import { createHookWrapper, mutateAndReturn } from "shared-runtime";
function useHook(t18) {
  const $ = useMemoCache(4);
  const { value } = t18;
  let t0;
  if ($[0] !== value) {
    t0 = mutateAndReturn({ value });
    $[0] = value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const x = t0;
  let t1;
  if ($[2] !== x) {
    t1 = {
      getValue() {
        return x;
      },
    };
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const obj = t1;
  return obj;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ value: 0 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"getValue":{"kind":"Function","result":{"value":0,"wat0":"joe"}}},"shouldInvokeFns":true}</div>