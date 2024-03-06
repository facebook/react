
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
  const $ = useMemoCache(8);
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
  if ($[2] !== b || $[3] !== c || $[4] !== t0) {
    let t2;
    if ($[6] !== c) {
      t2 = { c };
      $[6] = c;
      $[7] = t2;
    } else {
      t2 = $[7];
    }
    t1 = {
      x: t0,
      y() {
        return [b];
      },
      z: t2,
    };
    $[2] = b;
    $[3] = c;
    $[4] = t0;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2, c: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"x":[1],"y":{"kind":"Function","result":[2]},"z":{"c":2}},"shouldInvokeFns":true}</div>