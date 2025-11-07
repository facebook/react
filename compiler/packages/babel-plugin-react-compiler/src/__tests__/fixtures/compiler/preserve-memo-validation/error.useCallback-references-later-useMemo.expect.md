
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees:true
import {useCallback, useMemo} from 'react';

/**
 * Issue: When a useCallback references a value from a useMemo that is
 * declared later in the component, the compiler triggers a false positive
 * preserve-manual-memoization error.
 *
 * The error occurs because the validation checks that dependencies have
 * completed their scope before the manual memo block starts. However,
 * when the callback is declared before the useMemo, the useMemo's scope
 * hasn't completed yet.
 *
 * This is a valid pattern in React - declaration order doesn't matter
 * for the runtime behavior since both are memoized.
 */
function Component({value}) {
  // This callback references `memoizedValue` which is declared later
  const callback = useCallback(() => {
    return memoizedValue + 1;
  }, [memoizedValue]);

  // This useMemo is declared after the callback that uses it
  const memoizedValue = useMemo(() => {
    return value * 2;
  }, [value]);

  return {callback, memoizedValue};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 5}],
};

```


## Error

```
Found 1 error:

Error: Cannot access variable before it is declared

`memoizedValue` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

error.useCallback-references-later-useMemo.ts:21:6
  19 |   const callback = useCallback(() => {
  20 |     return memoizedValue + 1;
> 21 |   }, [memoizedValue]);
     |       ^^^^^^^^^^^^^ `memoizedValue` accessed before it is declared
  22 |
  23 |   // This useMemo is declared after the callback that uses it
  24 |   const memoizedValue = useMemo(() => {

error.useCallback-references-later-useMemo.ts:24:2
  22 |
  23 |   // This useMemo is declared after the callback that uses it
> 24 |   const memoizedValue = useMemo(() => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 25 |     return value * 2;
     | ^^^^^^^^^^^^^^^^^^^^^
> 26 |   }, [value]);
     | ^^^^^^^^^^^^^^^ `memoizedValue` is declared here
  27 |
  28 |   return {callback, memoizedValue};
  29 | }
```
          
      