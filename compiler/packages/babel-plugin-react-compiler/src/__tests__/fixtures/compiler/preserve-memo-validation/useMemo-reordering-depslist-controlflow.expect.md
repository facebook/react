
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
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { Stringify } from "shared-runtime";

function Foo(t0) {
  const $ = _c(12);
  let t1;
  let t2;
  let T0;
  let t3;
  if ($[0] !== t0) {
    let y;
    y = [];
    const { arr1, arr2, foo } = t0;
    let t4;
    if ($[5] !== arr1) {
      t4 = [arr1];
      $[5] = arr1;
      $[6] = t4;
    } else {
      t4 = $[6];
    }
    const x = t4;
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t5 = { x: 2 };
      $[7] = t5;
    } else {
      t5 = $[7];
    }
    t1 = t5;
    const val1 = t1;

    foo ? (y = x.concat(arr2)) : y;

    T0 = Stringify;
    t3 = val1;
    t2 = (() => [y])();
    $[0] = t0;
    $[1] = t2;
    $[2] = T0;
    $[3] = t3;
    $[4] = t1;
  } else {
    t2 = $[1];
    T0 = $[2];
    t3 = $[3];
    t1 = $[4];
  }
  const val2 = t2;
  let t4;
  if ($[8] !== T0 || $[9] !== t3 || $[10] !== val2) {
    t4 = <T0 val1={t3} val2={val2} />;
    $[8] = T0;
    $[9] = t3;
    $[10] = val2;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  return t4;
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