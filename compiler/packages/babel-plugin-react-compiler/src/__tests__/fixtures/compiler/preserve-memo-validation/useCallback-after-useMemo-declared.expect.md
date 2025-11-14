
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees:true
import {useCallback, useMemo} from 'react';

/**
 * This is the corrected version where the useMemo is declared before
 * the useCallback that references it. This should compile without errors.
 */
function Component({value}) {
  // useMemo declared first
  const memoizedValue = useMemo(() => {
    return value * 2;
  }, [value]);

  // useCallback references the memoizedValue declared above
  const callback = useCallback(() => {
    return memoizedValue + 1;
  }, [memoizedValue]);

  return {callback, memoizedValue};
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 5}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees:true
import { useCallback, useMemo } from "react";

/**
 * This is the corrected version where the useMemo is declared before
 * the useCallback that references it. This should compile without errors.
 */
function Component(t0) {
  const $ = _c(5);
  const { value } = t0;

  const memoizedValue = value * 2;
  let t1;
  if ($[0] !== memoizedValue) {
    t1 = () => memoizedValue + 1;
    $[0] = memoizedValue;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const callback = t1;
  let t2;
  if ($[2] !== callback || $[3] !== memoizedValue) {
    t2 = { callback, memoizedValue };
    $[2] = callback;
    $[3] = memoizedValue;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 5 }],
};

```
      
### Eval output
(kind: ok) {"callback":"[[ function params=0 ]]","memoizedValue":10}