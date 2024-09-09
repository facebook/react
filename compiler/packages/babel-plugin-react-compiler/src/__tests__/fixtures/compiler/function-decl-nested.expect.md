
## Input

```javascript
import {useRef} from 'react';

function C(x) {
  g();
  function g(x) {
    return 2;
  }
  g();
  f();
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
  g();
  function g(x_0) {
    return 2;
  }

  g();
  let t0;
  if ($[0] !== x.x) {
    f();
    function f() {
      return x.x;
    }
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

    t0 = h(f);
    $[0] = x.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[3] !== t0) {
    t1 = <>{t0}</>;
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{ x: 1 }],
};

```
      
### Eval output
(kind: ok) 2