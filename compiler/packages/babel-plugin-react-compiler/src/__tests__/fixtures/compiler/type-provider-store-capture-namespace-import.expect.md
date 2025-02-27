
## Input

```javascript
import {useMemo} from 'react';
import * as SharedRuntime from 'shared-runtime';

export function Component({a, b}) {
  const item1 = useMemo(() => ({a}), [a]);
  const item2 = useMemo(() => ({b}), [b]);
  const items = useMemo(() => {
    const items = [];
    SharedRuntime.typedArrayPush(items, item1);
    SharedRuntime.typedArrayPush(items, item2);
    return items;
  }, [item1, item2]);

  return (
    <>
      <SharedRuntime.ValidateMemoization inputs={[a]} output={items[0]} />
      <SharedRuntime.ValidateMemoization inputs={[b]} output={items[1]} />
      <SharedRuntime.ValidateMemoization inputs={[a, b]} output={items} />
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
import * as SharedRuntime from "shared-runtime";

export function Component(t0) {
  const $ = _c(27);
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
  let t5;
  let items;
  if ($[4] !== item1 || $[5] !== item2) {
    items = [];
    SharedRuntime.typedArrayPush(items, item1);
    SharedRuntime.typedArrayPush(items, item2);
    $[4] = item1;
    $[5] = item2;
    $[6] = items;
  } else {
    items = $[6];
  }
  t5 = items;
  const items_0 = t5;
  let t6;
  if ($[7] !== a) {
    t6 = [a];
    $[7] = a;
    $[8] = t6;
  } else {
    t6 = $[8];
  }
  let t7;
  if ($[9] !== items_0[0] || $[10] !== t6) {
    t7 = <SharedRuntime.ValidateMemoization inputs={t6} output={items_0[0]} />;
    $[9] = items_0[0];
    $[10] = t6;
    $[11] = t7;
  } else {
    t7 = $[11];
  }
  let t8;
  if ($[12] !== b) {
    t8 = [b];
    $[12] = b;
    $[13] = t8;
  } else {
    t8 = $[13];
  }
  let t9;
  if ($[14] !== items_0[1] || $[15] !== t8) {
    t9 = <SharedRuntime.ValidateMemoization inputs={t8} output={items_0[1]} />;
    $[14] = items_0[1];
    $[15] = t8;
    $[16] = t9;
  } else {
    t9 = $[16];
  }
  let t10;
  if ($[17] !== a || $[18] !== b) {
    t10 = [a, b];
    $[17] = a;
    $[18] = b;
    $[19] = t10;
  } else {
    t10 = $[19];
  }
  let t11;
  if ($[20] !== items_0 || $[21] !== t10) {
    t11 = <SharedRuntime.ValidateMemoization inputs={t10} output={items_0} />;
    $[20] = items_0;
    $[21] = t10;
    $[22] = t11;
  } else {
    t11 = $[22];
  }
  let t12;
  if ($[23] !== t11 || $[24] !== t7 || $[25] !== t9) {
    t12 = (
      <>
        {t7}
        {t9}
        {t11}
      </>
    );
    $[23] = t11;
    $[24] = t7;
    $[25] = t9;
    $[26] = t12;
  } else {
    t12 = $[26];
  }
  return t12;
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
(kind: ok) <div>{"inputs":[0],"output":{"a":0}}</div><div>{"inputs":[0],"output":{"b":0}}</div><div>{"inputs":[0,0],"output":[{"a":0},{"b":0}]}</div>
<div>{"inputs":[1],"output":{"a":1}}</div><div>{"inputs":[0],"output":{"b":0}}</div><div>{"inputs":[1,0],"output":[{"a":1},{"b":0}]}</div>
<div>{"inputs":[1],"output":{"a":1}}</div><div>{"inputs":[1],"output":{"b":1}}</div><div>{"inputs":[1,1],"output":[{"a":1},{"b":1}]}</div>
<div>{"inputs":[1],"output":{"a":1}}</div><div>{"inputs":[2],"output":{"b":2}}</div><div>{"inputs":[1,2],"output":[{"a":1},{"b":2}]}</div>
<div>{"inputs":[2],"output":{"a":2}}</div><div>{"inputs":[2],"output":{"b":2}}</div><div>{"inputs":[2,2],"output":[{"a":2},{"b":2}]}</div>
<div>{"inputs":[3],"output":{"a":3}}</div><div>{"inputs":[2],"output":{"b":2}}</div><div>{"inputs":[3,2],"output":[{"a":3},{"b":2}]}</div>
<div>{"inputs":[0],"output":{"a":0}}</div><div>{"inputs":[0],"output":{"b":0}}</div><div>{"inputs":[0,0],"output":[{"a":0},{"b":0}]}</div>