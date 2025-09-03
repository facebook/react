
## Input

```javascript
import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function useConfig() {
  return {a: 1, b: 2, c: 3};
}

function Component() {
  const {...spread} = useConfig();
  
  const result = useMemo(() => {
    return spread.a + spread.b + spread.c;
  }, [spread.a, spread.b, spread.c]);
  
  return <ValidateMemoization inputs={[spread.a, spread.b, spread.c]} output={result} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};
```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { ValidateMemoization } from "shared-runtime";

function useConfig() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { a: 1, b: 2, c: 3 };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function Component() {
  const $ = _c(9);
  const t0 = useConfig();
  let spread;
  if ($[0] !== t0) {
    ({ ...spread } = t0);
    $[0] = t0;
    $[1] = spread;
  } else {
    spread = $[1];
  }

  const result = spread.a + spread.b + spread.c;
  let t1;
  if ($[2] !== spread.a || $[3] !== spread.b || $[4] !== spread.c) {
    t1 = [spread.a, spread.b, spread.c];
    $[2] = spread.a;
    $[3] = spread.b;
    $[4] = spread.c;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  let t2;
  if ($[6] !== result || $[7] !== t1) {
    t2 = <ValidateMemoization inputs={t1} output={result} />;
    $[6] = result;
    $[7] = t1;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>{"inputs":[1,2,3],"output":6}</div>