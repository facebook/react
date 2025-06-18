
## Input

```javascript
import {useMemo} from 'react';
import {
  typedCapture,
  typedCreateFrom,
  typedMutate,
  ValidateMemoization,
} from 'shared-runtime';

function Component({a, b}) {
  const x = useMemo(() => [{a}], [a, b]);
  let z: any;
  if (b) {
    z = x;
  } else {
    z = typedCapture(x);
  }
  // could mutate x
  typedMutate(z, b);

  return <ValidateMemoization inputs={[a, b]} output={x} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 0, b: 1},
    {a: 1, b: 1},
    {a: 0, b: 0},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import {
  typedCapture,
  typedCreateFrom,
  typedMutate,
  ValidateMemoization,
} from "shared-runtime";

function Component(t0) {
  const $ = _c(12);
  const { a, b } = t0;
  let t1;
  let t2;
  if ($[0] !== a) {
    t2 = { a };
    $[0] = a;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let x;
  if ($[2] !== b || $[3] !== t2) {
    t1 = [t2];
    x = t1;
    let z;
    if (b) {
      z = x;
    } else {
      z = typedCapture(x);
    }

    typedMutate(z, b);
    $[2] = b;
    $[3] = t2;
    $[4] = x;
    $[5] = t1;
  } else {
    x = $[4];
    t1 = $[5];
  }
  let t3;
  if ($[6] !== a || $[7] !== b) {
    t3 = [a, b];
    $[6] = a;
    $[7] = b;
    $[8] = t3;
  } else {
    t3 = $[8];
  }
  let t4;
  if ($[9] !== t3 || $[10] !== x) {
    t4 = <ValidateMemoization inputs={t3} output={x} />;
    $[9] = t3;
    $[10] = x;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 0, b: 0 }],
  sequentialRenders: [
    { a: 0, b: 0 },
    { a: 0, b: 1 },
    { a: 1, b: 1 },
    { a: 0, b: 0 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[0,0],"output":[{"a":0}]}</div>
<div>{"inputs":[0,1],"output":[{"a":0}]}</div>
<div>{"inputs":[1,1],"output":[{"a":1}]}</div>
<div>{"inputs":[0,0],"output":[{"a":0}]}</div>