
## Input

```javascript
function component(foo, bar) {
  let x = { foo };
  let y = { bar };
  const f0 = function () {
    let a = { y };
    let b = x;
    a.x = b;
  };
  f0();
  mutate(y);
  return y;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(foo, bar) {
  const $ = _c(3);
  let t0;
  let t1;
  if ($[0] !== bar) {
    const y = { bar };

    t0 = y;

    t1 = y;
    mutate(y);
    $[0] = bar;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  const x = { foo };
  const f0 = function () {
    const a = { y };
    const b = x;
    a.x = b;
  };
  f0();
  return t1;
}

```
      