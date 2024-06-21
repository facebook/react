
## Input

```javascript
import { arrayPush } from "shared-runtime";

function Foo(cond) {
  let x = null;
  if (cond) {
    x = [];
  } else {
  }
  // Here, x = phi(x$null, x$[]) should receive a ValueKind of Mutable
  arrayPush(x, 2);

  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: true }],
  sequentialRenders: [{ cond: true }, { cond: true }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { arrayPush } from "shared-runtime";

function Foo(cond) {
  const $ = _c(2);
  let t0;
  if ($[0] !== cond) {
    let x = null;
    if (cond) {
      x = [];
    }

    t0 = x;
    arrayPush(x, 2);
    $[0] = cond;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{ cond: true }],
  sequentialRenders: [{ cond: true }, { cond: true }],
};

```
      
### Eval output
(kind: ok) [2]
[2]