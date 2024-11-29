
## Input

```javascript
function component(foo, bar) {
  let x = {foo};
  let y = {bar};
  const f0 = function () {
    let a = {y};
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
  let x;
  if ($[0] !== bar || $[1] !== foo) {
    x = { foo };
    const y = { bar };
    const f0 = function () {
      const a = { y };
      const b = x;
      a.x = b;
    };

    f0();
    mutate(y);
    $[0] = bar;
    $[1] = foo;
    $[2] = x;
  } else {
    x = $[2];
  }
  return x;
}

```
      