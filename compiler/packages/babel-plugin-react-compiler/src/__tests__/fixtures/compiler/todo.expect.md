
## Input

```javascript
function Component({x}) {
  return foo();
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(t0) {
  const $ = _c(1);
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = foo();
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented