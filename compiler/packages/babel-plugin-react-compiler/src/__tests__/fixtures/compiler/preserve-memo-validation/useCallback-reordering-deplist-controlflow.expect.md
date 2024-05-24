
## Input

```javascript
import { useCallback } from "react";
import { Stringify } from "shared-runtime";

function Foo({ arr1, arr2, foo }) {
  const x = [arr1];

  let y = [];

  const getVal1 = useCallback(() => {
    return { x: 2 };
  }, []);

  const getVal2 = useCallback(() => {
    return [y];
  }, [foo ? (y = x.concat(arr2)) : y]);

  return <Stringify val1={getVal1} val2={getVal2} shouldInvokeFns={true} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ arr1: [1, 2], arr2: [3, 4], foo: true }],
  sequentialRenders: [
    { arr1: [1, 2], arr2: [3, 4], foo: true },
    { arr1: [1, 2], arr2: [3, 4], foo: false },
  ],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useCallback } from "react";
import { Stringify } from "shared-runtime";

function Foo(t0) {
  const $ = _c(9);
  let t1;
  let getVal1;
  if ($[0] !== t0) {
    let y;
    y = [];
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = () => ({ x: 2 });
      $[3] = t2;
    } else {
      t2 = $[3];
    }

    t1 = () => [y];
    getVal1 = t2;
    const { arr1, arr2, foo } = t0;
    let t3;
    if ($[4] !== arr1) {
      t3 = [arr1];
      $[4] = arr1;
      $[5] = t3;
    } else {
      t3 = $[5];
    }
    const x = t3;
    foo ? (y = x.concat(arr2)) : y;
    $[0] = t0;
    $[1] = t1;
    $[2] = getVal1;
  } else {
    t1 = $[1];
    getVal1 = $[2];
  }
  const getVal2 = t1;
  let t2;
  if ($[6] !== getVal1 || $[7] !== getVal2) {
    t2 = <Stringify val1={getVal1} val2={getVal2} shouldInvokeFns={true} />;
    $[6] = getVal1;
    $[7] = getVal2;
    $[8] = t2;
  } else {
    t2 = $[8];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ arr1: [1, 2], arr2: [3, 4], foo: true }],
  sequentialRenders: [
    { arr1: [1, 2], arr2: [3, 4], foo: true },
    { arr1: [1, 2], arr2: [3, 4], foo: false },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"val1":{"kind":"Function","result":{"x":2}},"val2":{"kind":"Function","result":[[[1,2],3,4]]},"shouldInvokeFns":true}</div>
<div>{"val1":{"kind":"Function","result":{"x":2}},"val2":{"kind":"Function","result":[[]]},"shouldInvokeFns":true}</div>