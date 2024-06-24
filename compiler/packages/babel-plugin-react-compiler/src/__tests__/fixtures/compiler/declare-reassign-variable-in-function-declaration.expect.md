
## Input

```javascript
function Component() {
  let x = null;
  function foo() {
    x = 9;
  }
  const y = bar(foo);
  return <Child y={y} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let x;
    x = null;
    const foo = function foo() {
      x = 9;
    };

    const y = bar(foo);
    t0 = <Child y={y} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      