
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies
import {ValidateMemoization} from 'shared-runtime';
import {useMemo} from 'react';
function Component({arg}) {
  const data = useMemo(() => {
    const x = [];
    x.push(arg?.items);
    return x;
  }, [arg?.items]);
  return <ValidateMemoization inputs={[arg?.items]} output={data} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{arg: {items: 2}}],
  sequentialRenders: [
    {arg: {items: 2}},
    {arg: {items: 2}},
    {arg: null},
    {arg: null},
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees @enableOptionalDependencies
import { ValidateMemoization } from "shared-runtime";
import { useMemo } from "react";
function Component(t0) {
  const $ = _c(7);
  const { arg } = t0;

  arg?.items;
  let t1;
  let x;
  if ($[0] !== arg?.items) {
    x = [];
    x.push(arg?.items);
    $[0] = arg?.items;
    $[1] = x;
  } else {
    x = $[1];
  }
  t1 = x;
  const data = t1;
  const t2 = arg?.items;
  let t3;
  if ($[2] !== t2) {
    t3 = [t2];
    $[2] = t2;
    $[3] = t3;
  } else {
    t3 = $[3];
  }
  let t4;
  if ($[4] !== data || $[5] !== t3) {
    t4 = <ValidateMemoization inputs={t3} output={data} />;
    $[4] = data;
    $[5] = t3;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ arg: { items: 2 } }],
  sequentialRenders: [
    { arg: { items: 2 } },
    { arg: { items: 2 } },
    { arg: null },
    { arg: null },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[2],"output":[2]}</div>
<div>{"inputs":[2],"output":[2]}</div>
<div>{"inputs":[null],"output":[null]}</div>
<div>{"inputs":[null],"output":[null]}</div>