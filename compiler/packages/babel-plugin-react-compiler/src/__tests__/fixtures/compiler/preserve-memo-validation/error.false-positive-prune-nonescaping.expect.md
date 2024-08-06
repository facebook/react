
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useMemo} from 'react';
import {identity} from 'shared-runtime';

/**
 * This is technically a false positive, although it makes sense
 * to bailout as source code might be doing something sketchy.
 */
function useFoo(x) {
  useMemo(() => identity(x), [x]);
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [2],
};

```


## Error

```
   9 |  */
  10 | function useFoo(x) {
> 11 |   useMemo(() => identity(x), [x]);
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output. (11:11)
  12 | }
  13 |
  14 | export const FIXTURE_ENTRYPOINT = {
```
          
      