
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useMemo} from 'react';

// Here, Forget infers that the memo block dependency is input1
// 1. StartMemoize is emitted before the function expression
//    (and thus before the depslist arg and its rvalues)
// 2. x and y's overlapping reactive scopes forces y's reactive
//    scope to be extended to after the `mutate(x)` call, after
//    the StartMemoize instruction.
// While this is technically a false positive, this example would
// already fail the exhaustive-deps eslint rule.
function useFoo(input1) {
  const x = {};
  const y = [input1];
  const memoized = useMemo(() => {
    return [y];
  }, [(mutate(x), y)]);

  return [x, memoized];
}

```


## Error

```
  14 |   const x = {};
  15 |   const y = [input1];
> 16 |   const memoized = useMemo(() => {
     |                            ^^^^^^^
> 17 |     return [y];
     | ^^^^^^^^^^^^^^^
> 18 |   }, [(mutate(x), y)]);
     | ^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `input1`, but the source dependencies were [y]. Inferred different dependency than source (16:18)
  19 |
  20 |   return [x, memoized];
  21 | }
```
          
      