
## Input

```javascript
function Component(props) {
  let x = makeObject();
  x.foo(([x] = makeObject()));
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    let x = makeObject();

    t0 = x;
    x.foo(([x] = makeObject()));
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      