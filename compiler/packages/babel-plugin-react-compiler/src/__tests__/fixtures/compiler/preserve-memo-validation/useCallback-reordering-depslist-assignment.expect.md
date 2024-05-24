
## Input

```javascript
import { useCallback } from "react";
import { Stringify } from "shared-runtime";

// We currently produce invalid output (incorrect scoping for `y` declaration)
function useFoo(arr1, arr2) {
  const x = [arr1];

  let y;
  const getVal = useCallback(() => {
    return { y };
  }, [((y = x.concat(arr2)), y)]);

  return <Stringify getVal={getVal} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [
    [1, 2],
    [3, 4],
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useCallback } from "react";
import { Stringify } from "shared-runtime";

// We currently produce invalid output (incorrect scoping for `y` declaration)
function useFoo(arr1, arr2) {
  const $ = _c(7);
  let t0;
  if ($[0] !== arr1 || $[1] !== arr2) {
    let y;
    t0 = () => ({ y });
    let t1;
    if ($[3] !== arr1) {
      t1 = [arr1];
      $[3] = arr1;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    const x = t1;

    (y = x.concat(arr2)), y;
    $[0] = arr1;
    $[1] = arr2;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  const getVal = t0;
  let t1;
  if ($[5] !== getVal) {
    t1 = <Stringify getVal={getVal} shouldInvokeFns={true} />;
    $[5] = getVal;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [
    [1, 2],
    [3, 4],
  ],
};

```
      
### Eval output
(kind: ok) <div>{"getVal":{"kind":"Function","result":{"y":[[1,2],3,4]}},"shouldInvokeFns":true}</div>