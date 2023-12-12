
## Input

```javascript
import { createHookWrapper } from "shared-runtime";
function useHook({ a, b }) {
  return {
    x: function () {
      return [a];
    },
    y() {
      return [b];
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { createHookWrapper } from "shared-runtime";
function useHook(t16) {
  const $ = useMemoCache(5);
  const { a, b } = t16;
  let t0;
  if ($[0] !== a) {
    t0 = function () {
      return [a];
    };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== b || $[3] !== t0) {
    t1 = {
      x: t0,
      y() {
        return [b];
      },
    };
    $[2] = b;
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"x":{"kind":"Function","result":[1]},"y":{"kind":"Function","result":[2]}},"shouldInvokeFns":true}</div>