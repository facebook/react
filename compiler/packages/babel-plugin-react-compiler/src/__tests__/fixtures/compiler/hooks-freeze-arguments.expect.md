
## Input

```javascript
function Component() {
  const a = [];
  useFreeze(a); // should freeze
  useFreeze(a); // should be readonly
  call(a); // should be readonly
  return a;
}

function useFreeze(x) {}
function call(x) {}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(3);
  let a;
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    t0 = a;

    t1 = a;
    call(a);
    $[0] = a;
    $[1] = t0;
    $[2] = t1;
  } else {
    a = $[0];
    t0 = $[1];
    t1 = $[2];
  }
  useFreeze(a);
  useFreeze(t0);
  return t1;
}

function useFreeze(x) {}
function call(x) {}

```
      