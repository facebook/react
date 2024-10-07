
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useCallback} from 'react';
import {makeArray} from 'shared-runtime';

// This case is fine, as all reassignments happen before the useCallback
function Foo(props) {
  let x = [];
  x.push(props);
  x = makeArray();

  const cb = useCallback(() => [x], [x]);

  return cb;
}
export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

import { useCallback } from "react";
import { makeArray } from "shared-runtime";

// This case is fine, as all reassignments happen before the useCallback
function Foo(props) {
  const $ = _c(4);
  let x;
  if ($[0] !== props) {
    x = [];
    x.push(props);
    x = makeArray();
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }

  const t0 = x;
  let t1;
  if ($[2] !== t0) {
    t1 = () => [x];
    $[2] = t0;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  x;
  const cb = t1;
  return cb;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"