
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import { useCallback } from "react";
import { makeArray } from "shared-runtime";

// This case is already unsound in source, so we can safely bailout
function Foo(props) {
  let x = [];
  x.push(props);

  // makeArray() is captured, but depsList contains [props]
  const cb = useCallback(() => [x], [x]);

  x = makeArray();

  return cb;
}
export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```


## Error

```
  10 |
  11 |   // makeArray() is captured, but depsList contains [props]
> 12 |   const cb = useCallback(() => [x], [x]);
     |                          ^^^^^^^^^ Invariant: Unexpected mismatch between StartMemoize and FinishMemoize. Encountered StartMemoize id=undefined followed by FinishMemoize id=0 (12:12)
  13 |
  14 |   x = makeArray();
  15 |
```
          
      