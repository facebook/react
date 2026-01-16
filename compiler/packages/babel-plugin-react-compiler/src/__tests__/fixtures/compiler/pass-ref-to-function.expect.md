
## Input

```javascript
// @validateRefAccessDuringRender

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses a ref during render. The return type of foo() is unknown.
 */
function Component(props) {
  const ref = useRef(null);
  const x = foo(ref);
  return x.current;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateRefAccessDuringRender

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses a ref during render. The return type of foo() is unknown.
 */
function Component(props) {
  const $ = _c(1);
  const ref = useRef(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = foo(ref);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x.current;
}

```
      
### Eval output
(kind: exception) Fixture not implemented