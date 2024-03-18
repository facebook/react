
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
     |                          ^^^^^^^^^ [ReactForget] InvalidReact: This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized (12:12)

[ReactForget] InvalidReact: This value was manually memoized, but cannot be memoized under Forget because it may be mutated after it is memoized (12:12)
  13 |
  14 |   x = makeArray();
  15 |
```
          
      