
## Input

```javascript
import {useMemo} from 'react';
import {
  mutate,
  typedCapture,
  typedCreateFrom,
  typedMutate,
  ValidateMemoization,
} from 'shared-runtime';

function Component({a, b, c}: {a: number; b: number; c: number}) {
  const x = useMemo(() => [{value: a}], [a, b, c]);
  if (b === 0) {
    // This object should only depend on c, it cannot be affected by the later mutation
    x.push({value: c});
  } else {
    // This mutation shouldn't affect the object in the consequent
    mutate(x);
  }

  return (
    <>
      <ValidateMemoization inputs={[a, b, c]} output={x} />;
      {/* TODO: should only depend on c */}
      <ValidateMemoization inputs={[a, b, c]} output={x[0]} />;
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: 0, b: 0, c: 0}],
  sequentialRenders: [
    {a: 0, b: 0, c: 0},
    {a: 0, b: 1, c: 0},
    {a: 1, b: 1, c: 0},
    {a: 1, b: 1, c: 1},
    {a: 1, b: 1, c: 0},
    {a: 1, b: 0, c: 0},
    {a: 0, b: 0, c: 0},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import {
  mutate,
  typedCapture,
  typedCreateFrom,
  typedMutate,
  ValidateMemoization,
} from "shared-runtime";

function Component(t0) {
  const $ = _c(22);
  const { a, b, c } = t0;
  let t1;
  let x;
  if ($[0] !== a || $[1] !== b || $[2] !== c) {
    t1 = [{ value: a }];
    x = t1;
    if (b === 0) {
      x.push({ value: c });
    } else {
      mutate(x);
    }
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
    $[4] = t1;
  } else {
    x = $[3];
    t1 = $[4];
  }
  let t2;
  if ($[5] !== a || $[6] !== b || $[7] !== c) {
    t2 = [a, b, c];
    $[5] = a;
    $[6] = b;
    $[7] = c;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  let t3;
  if ($[9] !== t2 || $[10] !== x) {
    t3 = <ValidateMemoization inputs={t2} output={x} />;
    $[9] = t2;
    $[10] = x;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  let t4;
  if ($[12] !== a || $[13] !== b || $[14] !== c) {
    t4 = [a, b, c];
    $[12] = a;
    $[13] = b;
    $[14] = c;
    $[15] = t4;
  } else {
    t4 = $[15];
  }
  let t5;
  if ($[16] !== t4 || $[17] !== x[0]) {
    t5 = <ValidateMemoization inputs={t4} output={x[0]} />;
    $[16] = t4;
    $[17] = x[0];
    $[18] = t5;
  } else {
    t5 = $[18];
  }
  let t6;
  if ($[19] !== t3 || $[20] !== t5) {
    t6 = (
      <>
        {t3};{t5};
      </>
    );
    $[19] = t3;
    $[20] = t5;
    $[21] = t6;
  } else {
    t6 = $[21];
  }
  return t6;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: 0, b: 0, c: 0 }],
  sequentialRenders: [
    { a: 0, b: 0, c: 0 },
    { a: 0, b: 1, c: 0 },
    { a: 1, b: 1, c: 0 },
    { a: 1, b: 1, c: 1 },
    { a: 1, b: 1, c: 0 },
    { a: 1, b: 0, c: 0 },
    { a: 0, b: 0, c: 0 },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[0,0,0],"output":[{"value":0},{"value":0}]}</div>;<div>{"inputs":[0,0,0],"output":{"value":0}}</div>;
<div>{"inputs":[0,1,0],"output":[{"value":0},"joe"]}</div>;<div>{"inputs":[0,1,0],"output":{"value":0}}</div>;
<div>{"inputs":[1,1,0],"output":[{"value":1},"joe"]}</div>;<div>{"inputs":[1,1,0],"output":{"value":1}}</div>;
<div>{"inputs":[1,1,1],"output":[{"value":1},"joe"]}</div>;<div>{"inputs":[1,1,1],"output":{"value":1}}</div>;
<div>{"inputs":[1,1,0],"output":[{"value":1},"joe"]}</div>;<div>{"inputs":[1,1,0],"output":{"value":1}}</div>;
<div>{"inputs":[1,0,0],"output":[{"value":1},{"value":0}]}</div>;<div>{"inputs":[1,0,0],"output":{"value":1}}</div>;
<div>{"inputs":[0,0,0],"output":[{"value":0},{"value":0}]}</div>;<div>{"inputs":[0,0,0],"output":{"value":0}}</div>;