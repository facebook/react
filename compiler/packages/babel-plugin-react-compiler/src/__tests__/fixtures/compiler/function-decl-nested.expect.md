
## Input

```javascript
import {useRef} from 'react';

function C(x) {
  function g(x) {
    return 2;
  }
  g();
  function f() {
    return x.x;
  }
  function h(x) {
    return 2;
  }
  return <>{h(f)}</>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{x: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useRef } from "react";

function C(x) {
  const $ = _c(5);
  const g = function g(x_0) {
    return 2;
  };

  g();
  let t0;
  if ($[0] !== x.x) {
    t0 = function f() {
      return x.x;
    };
    $[0] = x.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const f = t0;
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = function h(x_1) {
      return 2;
    };
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const h = t1;

  const t2 = h(f);
  let t3;
  if ($[3] !== t2) {
    t3 = <>{t2}</>;
    $[3] = t2;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{ x: 1 }],
};

```
      
### Eval output
(kind: ok) 2