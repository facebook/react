
## Input

```javascript
import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function Component({...data}: {x: number, y: number}) {
  const result = useMemo(() => {
    return data.x + data.y;
  }, [data.x, data.y]);
  
  return <ValidateMemoization inputs={[data.x, data.y]} output={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 10, y: 20}],
  sequentialRenders: [{x: 10, y: 20}, {x: 10, y: 20}, {x: 15, y: 25}],
  isComponent: true,
};
```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { ValidateMemoization } from "shared-runtime";

function Component(t0) {
  const $ = _c(8);
  let data;
  if ($[0] !== t0) {
    ({ ...data } = t0);
    $[0] = t0;
    $[1] = data;
  } else {
    data = $[1];
  }
  const result = data.x + data.y;
  let t1;
  if ($[2] !== data.x || $[3] !== data.y) {
    t1 = [data.x, data.y];
    $[2] = data.x;
    $[3] = data.y;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  let t2;
  if ($[5] !== result || $[6] !== t1) {
    t2 = <ValidateMemoization inputs={t1} output={result} />;
    $[5] = result;
    $[6] = t1;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 10, y: 20 }],
  sequentialRenders: [
    { x: 10, y: 20 },
    { x: 10, y: 20 },
    { x: 15, y: 25 },
  ],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[10,20],"output":30}</div>
<div>{"inputs":[10,20],"output":30}</div>
<div>{"inputs":[15,25],"output":40}</div>