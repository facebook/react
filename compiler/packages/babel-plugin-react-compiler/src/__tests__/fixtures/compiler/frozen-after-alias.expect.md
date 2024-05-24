
## Input

```javascript
function Component() {
  const a = [];
  const b = a;
  useFreeze(a);
  foo(b); // should be readonly, value is guaranteed frozen via alias
  return b;
}

function useFreeze() {}
function foo(x) {}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(2);
  let a;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    const b = a;

    t0 = b;
    foo(b);
    $[0] = a;
    $[1] = t0;
  } else {
    a = $[0];
    t0 = $[1];
  }
  useFreeze(a);
  return t0;
}

function useFreeze() {}
function foo(x) {}

```
      