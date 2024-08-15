
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees:true

import {useRef, useMemo} from 'react';
import {makeArray} from 'shared-runtime';

function useFoo() {
  const r = useRef();
  return useMemo(() => makeArray(r), []);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees:true

import { useRef, useMemo } from "react";
import { makeArray } from "shared-runtime";

function useFoo() {
  const $ = _c(1);
  const r = useRef();
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = makeArray(r);
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  t0 = t1;
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```
      
### Eval output
(kind: ok) [{}]