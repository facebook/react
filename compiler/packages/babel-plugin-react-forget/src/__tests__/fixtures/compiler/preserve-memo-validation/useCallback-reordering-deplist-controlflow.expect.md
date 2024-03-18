
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
import { useCallback, unstable_useMemoCache as useMemoCache } from "react";
import { Stringify } from "shared-runtime";

function Foo(t0) {
  const $ = useMemoCache(11);
  const { arr1, arr2, foo } = t0;
  let t1;
  if ($[0] !== arr1) {
    t1 = [arr1];
    $[0] = arr1;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = t1;
  let t2;
  let getVal1;
  if ($[2] !== foo || $[3] !== x || $[4] !== arr2) {
    let y;
    y = [];
    let t3;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t3 = () => ({ x: 2 });
      $[7] = t3;
    } else {
      t3 = $[7];
    }
    getVal1 = t3;

    t2 = () => [y];
    foo ? (y = x.concat(arr2)) : y;
    $[2] = foo;
    $[3] = x;
    $[4] = arr2;
    $[5] = t2;
    $[6] = getVal1;
  } else {
    t2 = $[5];
    getVal1 = $[6];
  }
  const getVal2 = t2;
  let t3;
  if ($[8] !== getVal1 || $[9] !== getVal2) {
    t3 = <Stringify val1={getVal1} val2={getVal2} shouldInvokeFns={true} />;
    $[8] = getVal1;
    $[9] = getVal2;
    $[10] = t3;
  } else {
    t3 = $[10];
  }
  return t3;
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