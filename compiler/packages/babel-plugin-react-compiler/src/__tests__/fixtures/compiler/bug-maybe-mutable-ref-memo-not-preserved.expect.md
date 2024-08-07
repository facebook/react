
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
// @validatePreserveExistingMemoizationGuarantees:true

import { useRef, useMemo } from "react";
import { makeArray } from "shared-runtime";

function useFoo() {
  const r = useRef();
  let t0;
  t0 = makeArray(r);
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```
      
### Eval output
(kind: ok) [{}]