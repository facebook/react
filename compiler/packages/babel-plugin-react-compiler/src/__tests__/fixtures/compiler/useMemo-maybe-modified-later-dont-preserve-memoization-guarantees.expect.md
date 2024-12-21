
## Input

```javascript
// @enablePreserveExistingMemoizationGuarantees:false
import {useMemo} from 'react';
import {identity, makeObject_Primitives, mutate} from 'shared-runtime';

function Component(props) {
  const object = useMemo(() => makeObject_Primitives(), []);
  identity(object);
  return object;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enablePreserveExistingMemoizationGuarantees:false
import { useMemo } from "react";
import { identity, makeObject_Primitives, mutate } from "shared-runtime";

function Component(props) {
  const $ = _c(2);
  let t0;
  let object;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = makeObject_Primitives();
    object = t0;
    identity(object);
    $[0] = object;
    $[1] = t0;
  } else {
    object = $[0];
    t0 = $[1];
  }
  return object;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) {"a":0,"b":"value1","c":true}