
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useCallback, useRef} from 'react';

function Component() {
  let object = {};
  const cb = () => object; // maybeFreeze object
  object = 2;
  useFoo(cb);
  return [object, cb];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useCallback, useRef } from "react";

function Component() {
  const $ = _c(3);
  let cb;
  let object;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    object = {};
    cb = () => object;
    object = 2;
    $[0] = cb;
    $[1] = object;
  } else {
    cb = $[0];
    object = $[1];
  }
  useFoo(cb);
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [object, cb];
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented