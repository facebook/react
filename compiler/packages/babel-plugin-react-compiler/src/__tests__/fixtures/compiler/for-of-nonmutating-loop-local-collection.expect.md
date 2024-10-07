
## Input

```javascript
import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function Component({a, b}) {
  const x = useMemo(() => {
    return [a];
  }, [a]);
  const y = useMemo(() => {
    const items = [b];
    for (const i of x) {
      items.push(i);
    }
    return items;
  }, [x, b]);
  return (
    <>
      <ValidateMemoization inputs={[a]} output={x} />
      <ValidateMemoization inputs={[x, b]} output={y} />
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0}],
  sequentialRenders: [
    {a: 1, b: 0},
    {a: 1, b: 1},
    {a: 0, b: 1},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { ValidateMemoization } from "shared-runtime";

function Component(t0) {
  const $ = _c(19);
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
  const x = t1;
  let t3;
  let items;
  if ($[2] !== b || $[3] !== x) {
    items = [b];
    for (const i of x) {
      items.push(i);
    }
    $[2] = b;
    $[3] = x;
    $[4] = items;
  } else {
    items = $[4];
  }

  t3 = items;
  const y = t3;
  let t4;
  if ($[5] !== a) {
    t4 = [a];
    $[5] = a;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== t4 || $[8] !== x) {
    t5 = <ValidateMemoization inputs={t4} output={x} />;
    $[7] = t4;
    $[8] = x;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  let t6;
  if ($[10] !== x || $[11] !== b) {
    t6 = [x, b];
    $[10] = x;
    $[11] = b;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  let t7;
  if ($[13] !== t6 || $[14] !== y) {
    t7 = <ValidateMemoization inputs={t6} output={y} />;
    $[13] = t6;
    $[14] = y;
    $[15] = t7;
  } else {
    t7 = $[15];
  }
  let t8;
  if ($[16] !== t5 || $[17] !== t7) {
    t8 = (
      <>
        {t5}
        {t7}
      </>
    );
    $[16] = t5;
    $[17] = t7;
    $[18] = t8;
  } else {
    t8 = $[18];
  }
  return t8;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 0, b: 0 }],
  sequentialRenders: [
    { a: 1, b: 0 },
    { a: 1, b: 1 },
    { a: 0, b: 1 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[1],"output":[1]}</div><div>{"inputs":[[1],0],"output":[0,1]}</div>
<div>{"inputs":[1],"output":[1]}</div><div>{"inputs":[[1],1],"output":[1,1]}</div>
<div>{"inputs":[0],"output":[0]}</div><div>{"inputs":[[0],1],"output":[1,0]}</div>