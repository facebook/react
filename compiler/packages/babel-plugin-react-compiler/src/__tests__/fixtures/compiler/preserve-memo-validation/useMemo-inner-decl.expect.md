
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {identity} from 'shared-runtime';

function useFoo(data) {
  return useMemo(() => {
    const temp = identity(data.a);
    return {temp};
  }, [data.a]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{a: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useMemo } from "react";
import { identity } from "shared-runtime";

function useFoo(data) {
  const $ = _c(4);
  let t0;
  let t1;
  if ($[0] !== data.a) {
    t1 = identity(data.a);
    $[0] = data.a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const temp = t1;
  let t2;
  if ($[2] !== temp) {
    t2 = { temp };
    $[2] = temp;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  t0 = t2;
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ a: 2 }],
};

```
      
### Eval output
(kind: ok) {"temp":2}