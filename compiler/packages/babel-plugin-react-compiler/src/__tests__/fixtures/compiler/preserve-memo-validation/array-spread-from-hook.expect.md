
## Input

```javascript
import {useMemo} from 'react';
import {ValidateMemoization} from 'shared-runtime';

function useData() {
  return ['a', 'b', 'c'];
}

function Component() {
  const [first, ...rest] = useData();

  const result = useMemo(() => {
    return rest.join('-');
  }, [rest]);

  return <ValidateMemoization inputs={[rest]} output={result} />;
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

function useData() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = ["a", "b", "c"];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

function Component() {
  const $ = _c(7);
  const t0 = useData();
  let rest;
  if ($[0] !== t0) {
    [, ...rest] = t0;
    $[0] = t0;
    $[1] = rest;
  } else {
    rest = $[1];
  }

  const result = rest.join("-");
  let t1;
  if ($[2] !== rest) {
    t1 = [rest];
    $[2] = rest;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== result || $[5] !== t1) {
    t2 = <ValidateMemoization inputs={t1} output={result} />;
    $[4] = result;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
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
(kind: ok) <div>{"inputs":[["b","c"]],"output":"b-c"}</div>