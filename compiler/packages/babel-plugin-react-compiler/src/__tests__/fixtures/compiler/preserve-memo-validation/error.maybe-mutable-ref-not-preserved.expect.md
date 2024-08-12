
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


## Error

```
   6 | function useFoo() {
   7 |   const r = useRef();
>  8 |   return useMemo(() => makeArray(r), []);
     |          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ CannotPreserveMemoization: React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output. (8:8)
   9 | }
  10 |
  11 | export const FIXTURE_ENTRYPOINT = {
```
          
      