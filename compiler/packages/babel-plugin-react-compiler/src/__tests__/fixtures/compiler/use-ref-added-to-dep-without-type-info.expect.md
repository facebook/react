
## Input

```javascript
// @validateRefAccessDuringRender

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses a ref during render. Type info is lost when ref is
 * stored in an object field.
 */
function Foo({a}) {
  const ref = useRef();
  const val = {ref};
  const x = {a, val: val.ref.current};

  return <VideoList videos={x} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateRefAccessDuringRender

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses a ref during render. Type info is lost when ref is
 * stored in an object field.
 */
function Foo(t0) {
  const $ = _c(3);
  const { a } = t0;
  const ref = useRef();
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = { ref };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  const val = t1;
  let t2;
  if ($[1] !== a) {
    const x = { a, val: val.ref.current };
    t2 = <VideoList videos={x} />;
    $[1] = a;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented