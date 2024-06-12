
## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
  } else {
    let z = {};
    x.z = z;
  }
  mutate(x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(a) {
  const $ = _c(2);
  let t0;
  if ($[0] !== a) {
    const x = {};
    if (a) {
      const y = {};
      x.y = y;
    } else {
      const z = {};
      x.z = z;
    }

    t0 = x;
    mutate(x);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      