
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
  const t7 = items_0[0];
  let t8;
  if ($[9] !== t6 || $[10] !== t7) {
    t8 = <SharedRuntime.ValidateMemoization inputs={t6} output={t7} />;
    $[9] = t6;
    $[10] = t7;
    $[11] = t8;
  } else {
    t8 = $[11];
  }
  let t9;
  if ($[12] !== b) {
    t9 = [b];
    $[12] = b;
    $[13] = t9;
  } else {
    t9 = $[13];
  }
  const t10 = items_0[1];
  let t11;
  if ($[14] !== t9 || $[15] !== t10) {
    t11 = <SharedRuntime.ValidateMemoization inputs={t9} output={t10} />;
    $[14] = t9;
    $[15] = t10;
    $[16] = t11;
  } else {
    t11 = $[16];
  }
  let t12;
  if ($[17] !== a || $[18] !== b) {
    t12 = [a, b];
    $[17] = a;
    $[18] = b;
    $[19] = t12;
  } else {
    t12 = $[19];
  }
  let t13;
  if ($[20] !== t12 || $[21] !== items_0) {
    t13 = <SharedRuntime.ValidateMemoization inputs={t12} output={items_0} />;
    $[20] = t12;
    $[21] = items_0;
    $[22] = t13;
  } else {
    t13 = $[22];
  }
  let t14;
  if ($[23] !== t8 || $[24] !== t11 || $[25] !== t13) {
    t14 = (
      <>
        {t8}
        {t11}
        {t13}
      </>
    );
    $[23] = t8;
    $[24] = t11;
    $[25] = t13;
    $[26] = t14;
  } else {
    t14 = $[26];
  }
  return t14;
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