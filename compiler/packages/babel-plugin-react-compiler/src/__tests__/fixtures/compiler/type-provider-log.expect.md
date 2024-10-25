
## Input

```javascript
import {useMemo} from 'react';
import {typedLog, ValidateMemoization} from 'shared-runtime';

export function Component({a, b}) {
  const item1 = useMemo(() => ({a}), [a]);
  const item2 = useMemo(() => ({b}), [b]);
  typedLog(item1, item2);

  return (
    <>
      <ValidateMemoization inputs={[a]} output={item1} />
      <ValidateMemoization inputs={[b]} output={item2} />
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
import { typedLog, ValidateMemoization } from "shared-runtime";

export function Component(t0) {
  const $ = _c(17);
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
  t1 = t2;
  const item1 = t1;
  let t3;
  let t4;
  if ($[2] !== b) {
    t4 = { b };
    $[2] = b;
    $[3] = t4;
  } else {
    t4 = $[3];
  }
  t3 = t4;
  const item2 = t3;
  typedLog(item1, item2);
  let t5;
  if ($[4] !== a) {
    t5 = [a];
    $[4] = a;
    $[5] = t5;
  } else {
    t5 = $[5];
  }
  let t6;
  if ($[6] !== t5 || $[7] !== item1) {
    t6 = <ValidateMemoization inputs={t5} output={item1} />;
    $[6] = t5;
    $[7] = item1;
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  let t7;
  if ($[9] !== b) {
    t7 = [b];
    $[9] = b;
    $[10] = t7;
  } else {
    t7 = $[10];
  }
  let t8;
  if ($[11] !== t7 || $[12] !== item2) {
    t8 = <ValidateMemoization inputs={t7} output={item2} />;
    $[11] = t7;
    $[12] = item2;
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  let t9;
  if ($[14] !== t6 || $[15] !== t8) {
    t9 = (
      <>
        {t6}
        {t8}
      </>
    );
    $[14] = t6;
    $[15] = t8;
    $[16] = t9;
  } else {
    t9 = $[16];
  }
  return t9;
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
(kind: ok) <div>{"inputs":[0],"output":{"a":0}}</div><div>{"inputs":[0],"output":{"b":0}}</div>
<div>{"inputs":[1],"output":{"a":1}}</div><div>{"inputs":[0],"output":{"b":0}}</div>
<div>{"inputs":[1],"output":{"a":1}}</div><div>{"inputs":[1],"output":{"b":1}}</div>
<div>{"inputs":[1],"output":{"a":1}}</div><div>{"inputs":[2],"output":{"b":2}}</div>
<div>{"inputs":[2],"output":{"a":2}}</div><div>{"inputs":[2],"output":{"b":2}}</div>
<div>{"inputs":[3],"output":{"a":3}}</div><div>{"inputs":[2],"output":{"b":2}}</div>
<div>{"inputs":[0],"output":{"a":0}}</div><div>{"inputs":[0],"output":{"b":0}}</div>
logs: [{ a: 0 },{ b: 0 },{ a: 1 },{ b: 0 },{ a: 1 },{ b: 1 },{ a: 1 },{ b: 2 },{ a: 2 },{ b: 2 },{ a: 3 },{ b: 2 },{ a: 0 },{ b: 0 }]