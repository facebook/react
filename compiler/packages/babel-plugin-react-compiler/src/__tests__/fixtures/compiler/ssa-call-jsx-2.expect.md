
## Input

```javascript
// @Pass runMutableRangeAnalysis
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  if (foo()) {
    let _ = <div a={a} />;
  }
  foo(a, b);
  return <div a={a} b={b} />;
}

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime"; // @Pass runMutableRangeAnalysis
function foo() {}

function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = [];
    const b = {};
    foo(a, b);
    if (foo()) {
    }

    foo(a, b);
    t0 = <div a={a} b={b} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      