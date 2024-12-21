
## Input

```javascript
function component(a, b) {
  let z = {a};
  let p = () => <Foo>{z}</Foo>;
  return p();
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a, b) {
  const $ = _c(6);
  let t0;
  if ($[0] !== a) {
    t0 = { a };
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const z = t0;
  let t1;
  if ($[2] !== z) {
    t1 = () => <Foo>{z}</Foo>;
    $[2] = z;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const p = t1;
  let t2;
  if ($[4] !== p) {
    t2 = p();
    $[4] = p;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

```
      