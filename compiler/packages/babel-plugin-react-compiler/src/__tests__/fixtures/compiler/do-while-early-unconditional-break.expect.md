
## Input

```javascript
function Component(props) {
  let x = [1, 2, 3];
  do {
    mutate(x);
    break;
  } while (props.cond);
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
    const x = [1, 2, 3];

    t0 = x;
    mutate(x);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      