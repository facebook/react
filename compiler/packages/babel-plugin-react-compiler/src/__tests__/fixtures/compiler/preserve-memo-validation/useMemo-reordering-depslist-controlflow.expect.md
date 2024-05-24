
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
  const $ = _c(11);
  let t1;
  let T0;
  let t2;
  if ($[0] !== t0) {
    let y;
    y = [];
    let t3;
    const { arr1, arr2, foo } = t0;
    let t4;
    if ($[4] !== arr1) {
      t4 = [arr1];
      $[4] = arr1;
      $[5] = t4;
    } else {
      t4 = $[5];
    }
    const x = t4;
    let t5;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
      t5 = { x: 2 };
      $[6] = t5;
    } else {
      t5 = $[6];
    }
    t3 = t5;
    const val1 = t3;

    foo ? (y = x.concat(arr2)) : y;

    T0 = Stringify;
    t2 = val1;
    t1 = (() => [y])();
    $[0] = t0;
    $[1] = t1;
    $[2] = T0;
    $[3] = t2;
  } else {
    t1 = $[1];
    T0 = $[2];
    t2 = $[3];
  }
  const val2 = t1;
  let t3;
  if ($[7] !== T0 || $[8] !== t2 || $[9] !== val2) {
    t3 = <T0 val1={t2} val2={val2} />;
    $[7] = T0;
    $[8] = t2;
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