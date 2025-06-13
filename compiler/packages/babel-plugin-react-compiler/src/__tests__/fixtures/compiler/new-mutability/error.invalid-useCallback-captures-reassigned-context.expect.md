
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees @enableNewMutationAliasingModel
import {useCallback} from 'react';
import {makeArray} from 'shared-runtime';

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
   9 |
  10 |   // makeArray() is captured, but depsList contains [props]
> 11 |   const cb = useCallback(() => [x], [x]);
     |                                      ^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This dependency may be mutated later, which could cause the value to change unexpectedly (11:11)

CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output. (11:11)
  12 |
  13 |   x = makeArray();
  14 |
```
          
      