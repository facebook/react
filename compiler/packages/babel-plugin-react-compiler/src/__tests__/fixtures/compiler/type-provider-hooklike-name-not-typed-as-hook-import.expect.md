
## Input

```javascript
import {useMemo} from 'react';
import {
  useArrayConcatNotTypedAsHook,
  ValidateMemoization,
} from 'shared-runtime';

export function Component({a, b}) {
  const item1 = useMemo(() => [a], [a]);
  const item2 = useMemo(() => [b], [b]);
  const item3 = useArrayConcatNotTypedAsHook(item1, item2);

  return (
    <>
      <ValidateMemoization inputs={[a, b]} output={item3} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 0, b: 0},
    {a: 1, b: 0},
    {a: 1, b: 1},
    {a: 1, b: 2},
    {a: 2, b: 2},
    {a: 3, b: 2},
    {a: 0, b: 0},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import {
  useArrayConcatNotTypedAsHook,
  ValidateMemoization,
} from "shared-runtime";

export function Component(t0) {
  const $ = _c(10);
  const { a, b } = t0;
  let t1;
  let t2;
  if ($[0] !== a) {
    t2 = [a];
    $[0] = a;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  t1 = t2;
  const item1 = t1;
  let t3;
  let t4;
  if ($[2] !== b) {
    t4 = [b];
    $[2] = b;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  t3 = t4;
  const item2 = t3;
  const item3 = useArrayConcatNotTypedAsHook(item1, item2);
  let t5;
  if ($[4] !== a || $[5] !== b) {
    t5 = [a, b];
    $[4] = a;
    $[5] = b;
    $[6] = t5;
  } else {
    t5 = $[6];
  }
  let t6;
  if ($[7] !== t5 || $[8] !== item3) {
    t6 = (
      <>
        <ValidateMemoization inputs={t5} output={item3} />
      </>
    );
    $[7] = t5;
    $[8] = item3;
    $[9] = t6;
  } else {
    t6 = $[9];
  }
  return t6;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 0, b: 0 }],
  sequentialRenders: [
    { a: 0, b: 0 },
    { a: 1, b: 0 },
    { a: 1, b: 1 },
    { a: 1, b: 2 },
    { a: 2, b: 2 },
    { a: 3, b: 2 },
    { a: 0, b: 0 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[0,0],"output":[0,0]}</div>
<div>{"inputs":[1,0],"output":[1,0]}</div>
<div>{"inputs":[1,1],"output":[1,1]}</div>
<div>{"inputs":[1,2],"output":[1,2]}</div>
<div>{"inputs":[2,2],"output":[2,2]}</div>
<div>{"inputs":[3,2],"output":[3,2]}</div>
<div>{"inputs":[0,0],"output":[0,0]}</div>