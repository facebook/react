
## Input

```javascript
import {useMemo} from 'react';
import {identity} from 'shared-runtime';

function useHook({a, b}) {
  const valA = useMemo(() => identity({a}), [a]);
  const valB = useMemo(() => identity([b]), [b]);
  return [valA, valB];
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{a: 2, b: 3}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { identity } from "shared-runtime";

function useHook(t0) {
  const $ = _c(7);
  const { a, b } = t0;
  let t1;
  let t2;
  if ($[0] !== a) {
    t2 = identity({ a });
    $[0] = a;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  t1 = t2;
  const valA = t1;
  let t3;
  let t4;
  if ($[2] !== b) {
    t4 = identity([b]);
    $[2] = b;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  t3 = t4;
  const valB = t3;
  let t5;
  if ($[4] !== valA || $[5] !== valB) {
    t5 = [valA, valB];
    $[4] = valA;
    $[5] = valB;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  return t5;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useHook,
  params: [{ a: 2, b: 3 }],
};

```
      
### Eval output
(kind: ok) [{"a":2},[3]]