
## Input

```javascript
function Component() {
  const x = 4;

  const get4 = () => {
    while (bar()) {
      if (baz) {
        bar();
      }
    }
    return () => x;
  };

  return get4;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      while (bar()) {
        if (baz) {
          bar();
        }
      }
      return () => 4;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const get4 = t0;
  return get4;
}

```
      