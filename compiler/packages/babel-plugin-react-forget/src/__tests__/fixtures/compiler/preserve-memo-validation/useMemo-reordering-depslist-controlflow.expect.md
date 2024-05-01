
## Input

```javascript
import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Foo({ arr1, arr2, foo }) {
  const x = [arr1];

  let y = [];

  const val1 = useMemo(() => {
    return { x: 2 };
  }, []);

  const val2 = useMemo(() => {
    return [y];
  }, [foo ? (y = x.concat(arr2)) : y]);

  return <Stringify val1={val1} val2={val2} />;
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
import { useMemo, c as useMemoCache } from "react";
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
  let val1;
  if ($[2] !== foo || $[3] !== x || $[4] !== arr2) {
    let y;
    y = [];
    let t3;
    let t4;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t4 = { x: 2 };
      $[7] = t4;
    } else {
      t4 = $[7];
    }
    t3 = t4;
    val1 = t3;

    foo ? (y = x.concat(arr2)) : y;
    t2 = (() => [y])();
    $[2] = foo;
    $[3] = x;
    $[4] = arr2;
    $[5] = t2;
    $[6] = val1;
  } else {
    t2 = $[5];
    val1 = $[6];
  }
  const val2 = t2;
  let t3;
  if ($[8] !== val1 || $[9] !== val2) {
    t3 = <Stringify val1={val1} val2={val2} />;
    $[8] = val1;
    $[9] = val2;
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
(kind: ok) <div>{"val1":{"x":2},"val2":[[[1,2],3,4]]}</div>
<div>{"val1":{"x":2},"val2":[[]]}</div>