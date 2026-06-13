
## Input

```javascript
import {createHookWrapper} from 'shared-runtime';

function useHook({a, b, c}) {
  return {
    x: [a],
    y() {
      return [b];
    },
    z: {c},
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{a: 1, b: 2, c: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { createHookWrapper } from "shared-runtime";

function useHook(t0) {
  const $ = _c(10);
  const { a, b, c } = t0;
  let t1;
  if ($[0] !== a) {
    t1 = [a];
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== b) {
    t2 = function () {
      return [b];
    };
    $[2] = b;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== c) {
    t3 = { c };
    $[4] = c;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== t1 || $[7] !== t2 || $[8] !== t3) {
    t4 = { x: t1, y: t2, z: t3 };
    $[6] = t1;
    $[7] = t2;
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: createHookWrapper(useHook),
  params: [{ a: 1, b: 2, c: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"result":{"x":[1],"y":{"kind":"Function","result":[2]},"z":{"c":2}},"shouldInvokeFns":true}</div>