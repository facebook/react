
## Input

```javascript
import { mutate } from "shared-runtime";

/**
 * Fixture showing why `concat` needs to capture both the callee and rest args.
 * Here, observe that arr1's values are captured into arr2.
 *  - Later mutations of arr2 may write to values within arr1.
 *  - Observe that it's technically valid to separately memoize the array arr1
 *    itself.
 */
function Foo({ inputNum }) {
  const arr1: Array<number | object> = [{ a: 1 }, {}];
  const arr2 = arr1.concat([1, inputNum]);
  mutate(arr2[0]);
  return arr2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ inputNum: 2 }],
  sequentialRenders: [{ inputNum: 2 }, { inputNum: 3 }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { mutate } from "shared-runtime";

/**
 * Fixture showing why `concat` needs to capture both the callee and rest args.
 * Here, observe that arr1's values are captured into arr2.
 *  - Later mutations of arr2 may write to values within arr1.
 *  - Observe that it's technically valid to separately memoize the array arr1
 *    itself.
 */
function Foo(t0) {
  const $ = _c(3);
  const { inputNum } = t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [{ a: 1 }, {}];
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const arr1 = t1;
  let arr2;
  if ($[1] !== inputNum) {
    arr2 = arr1.concat([1, inputNum]);
    mutate(arr2[0]);
    $[1] = inputNum;
    $[2] = arr2;
  } else {
    arr2 = $[2];
  }
  return arr2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ inputNum: 2 }],
  sequentialRenders: [{ inputNum: 2 }, { inputNum: 3 }],
};

```
      