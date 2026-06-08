
## Input

```javascript
// @flow
function Foo() {
  function hasError() {
    let hasError = false;
    return hasError;
  }
  return <div x={hasError} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Foo() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const hasError_0 = function hasError() {
      return false;
    };
    t0 = <div x={hasError_0} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented