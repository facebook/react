
## Input

```javascript
function component(foo, bar) {
  let x = { foo };
  let y = { bar };
  const f0 = function () {
    let a = [y];
    let b = x;
    a.x = b;
  };
  f0();
  mutate(y);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(foo, bar) {
  const $ = _c(3);
  let t0;
  if ($[0] !== foo || $[1] !== bar) {
    const x = { foo };

    t0 = x;
    const y = { bar };
    const f0 = function () {
      const a = [y];
      const b = x;
      a.x = b;
    };
    f0();
    mutate(y);
    $[0] = foo;
    $[1] = bar;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      