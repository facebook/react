
## Input

```javascript
import { createHookWrapper } from "shared-runtime";

function useHook({ a, b, c }) {
  return {
    x: [a],
    y() {
      return [b];
    },
    z: { c },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2, c: 2 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { createHookWrapper } from "shared-runtime";

function useHook(t16) {
  const $ = useMemoCache(7);
  const { a, b, c } = t16;
  let t0;
  if ($[0] !== a) {
    t0 = [a];
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== c) {
    t1 = { c };
    $[2] = c;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== t0 || $[5] !== t1) {
    t2 = {
      x: t0,
      y() {
        return [b];
      },
      z: t1,
    };
    $[4] = t0;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2, c: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"x":[1],"y":{"kind":"Function","result":[2]},"z":{"c":2}},"shouldInvokeFns":true}</div>