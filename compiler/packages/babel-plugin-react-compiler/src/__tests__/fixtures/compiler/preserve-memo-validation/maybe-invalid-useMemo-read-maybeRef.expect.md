
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';

function useHook(maybeRef) {
  return useMemo(() => {
    return () => [maybeRef.current];
  }, [maybeRef]);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
import { useMemo } from "react";

function useHook(maybeRef) {
  const $ = _c(2);
  let t0;
  let t1;
  if ($[0] !== maybeRef) {
    t1 = () => [maybeRef.current];
    $[0] = maybeRef;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented