
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
  const o: any = useMemo(() => ({a}), [a]);
  const x: Array<any> = useMemo(() => [o], [o, b]);
  const y = typedCapture(x);
  const z = typedCapture(y);
  x.push(z);
  x.push(b);

  return (
    <>
      <ValidateMemoization inputs={[a]} output={o} />;
      <ValidateMemoization inputs={[a, b]} output={x} />;
    </>
  );
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
  const $ = _c(20);
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
  const o = t1;
  let t3;
  let x;
  if ($[2] !== b || $[3] !== o) {
    t3 = [o];
    x = t3;
    const y = typedCapture(x);
    const z = typedCapture(y);
    x.push(z);
    x.push(b);
    $[2] = b;
    $[3] = o;
    $[4] = x;
    $[5] = t3;
  } else {
    x = $[4];
    t3 = $[5];
  }
  let t4;
  if ($[6] !== a) {
    t4 = [a];
    $[6] = a;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  let t5;
  if ($[8] !== o || $[9] !== t4) {
    t5 = <ValidateMemoization inputs={t4} output={o} />;
    $[8] = o;
    $[9] = t4;
    $[10] = t5;
  } else {
    t5 = $[10];
  }
  let t6;
  if ($[11] !== a || $[12] !== b) {
    t6 = [a, b];
    $[11] = a;
    $[12] = b;
    $[13] = t6;
  } else {
    t6 = $[13];
  }
  let t7;
  if ($[14] !== t6 || $[15] !== x) {
    t7 = <ValidateMemoization inputs={t6} output={x} />;
    $[14] = t6;
    $[15] = x;
    $[16] = t7;
  } else {
    t7 = $[16];
  }
  let t8;
  if ($[17] !== t5 || $[18] !== t7) {
    t8 = (
      <>
        {t5};{t7};
      </>
    );
    $[17] = t5;
    $[18] = t7;
    $[19] = t8;
  } else {
    t8 = $[19];
  }
  return t8;
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
(kind: ok) <div>{"inputs":[0],"output":{"a":0}}</div>;<div>{"inputs":[0,0],"output":[{"a":0},[["[[ cyclic ref *2 ]]"]],0]}</div>;
<div>{"inputs":[0],"output":{"a":0}}</div>;<div>{"inputs":[0,1],"output":[{"a":0},[["[[ cyclic ref *2 ]]"]],1]}</div>;
<div>{"inputs":[1],"output":{"a":1}}</div>;<div>{"inputs":[1,1],"output":[{"a":1},[["[[ cyclic ref *2 ]]"]],1]}</div>;
<div>{"inputs":[0],"output":{"a":0}}</div>;<div>{"inputs":[0,0],"output":[{"a":0},[["[[ cyclic ref *2 ]]"]],0]}</div>;