
## Input

```javascript
import {useMemo, useState} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function Component(props) {
  const [state] = useState(0);
  // Test for conflicts with `c` import
  const c = state;
  const _c = c;
  const __c = _c;
  const c1 = __c;
  const $c = c1;
  const array = useMemo(() => [$c], [state]);
  return <ValidateMemoization inputs={[state]} output={array} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}, {}],
};

```

## Code

```javascript
import { c as _c2 } from "react/compiler-runtime";
import { useMemo, useState } from "react";
import { ValidateMemoization } from "shared-runtime";

function Component(props) {
  const $ = _c2(7);
  const [state] = useState(0);

  const c = state;
  const _c = c;
  const __c = _c;
  const c1 = __c;
  const $c = c1;
  let t0;
  let t1;
  if ($[0] !== $c) {
    t1 = [$c];
    $[0] = $c;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  const array = t0;
  let t2;
  if ($[2] !== state) {
    t2 = [state];
    $[2] = state;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t2 || $[5] !== array) {
    t3 = <ValidateMemoization inputs={t2} output={array} />;
    $[4] = t2;
    $[5] = array;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}, {}],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[0],"output":[0]}</div>
<div>{"inputs":[0],"output":[0]}</div>
<div>{"inputs":[0],"output":[0]}</div>