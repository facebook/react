
## Input

```javascript
import {useMemo} from 'react';
import {
  typedCapture,
  typedCreateFrom,
  typedMutate,
  ValidateMemoization,
} from 'shared-runtime';

function Component({a, b}: {a: number; b: number}) {
  const x = useMemo(() => ({a}), [a, b]);
  const f = () => {
    const y = typedCapture(x);
    const z = typedCreateFrom(y);
    return z;
  };
  const z = f();
  // mutates x
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
  const $ = _c(10);
  const { a, b } = t0;
  let t1;
  let x;
  if ($[0] !== a || $[1] !== b) {
    t1 = { a };
    x = t1;
    const f = () => {
      const y = typedCapture(x);
      const z = typedCreateFrom(y);
      return z;
    };

    const z_0 = f();

    typedMutate(z_0, b);
    $[0] = a;
    $[1] = b;
    $[2] = x;
    $[3] = t1;
  } else {
    x = $[2];
    t1 = $[3];
  }
  let t2;
  if ($[4] !== a || $[5] !== b) {
    t2 = [a, b];
    $[4] = a;
    $[5] = b;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  let t3;
  if ($[7] !== t2 || $[8] !== x) {
    t3 = <ValidateMemoization inputs={t2} output={x} />;
    $[7] = t2;
    $[8] = x;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  return t3;
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
(kind: ok) <div>{"inputs":[0,0],"output":{"a":0,"property":0}}</div>
<div>{"inputs":[0,1],"output":{"a":0,"property":1}}</div>
<div>{"inputs":[1,1],"output":{"a":1,"property":1}}</div>
<div>{"inputs":[0,0],"output":{"a":0,"property":0}}</div>