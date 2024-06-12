
## Input

```javascript
const { mutate } = require("shared-runtime");

function component(foo, bar) {
  let x = { foo };
  let y = { bar };
  (function () {
    let a = { y };
    let b = x;
    a.x = b;
  })();
  mutate(y);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["foo", "bar"],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const { mutate } = require("shared-runtime");

function component(foo, bar) {
  const $ = _c(3);
  let t0;
  if ($[0] !== foo || $[1] !== bar) {
    const x = { foo };
    const y = { bar };

    const a = { y };
    const b = x;
    a.x = b;

    t0 = y;
    mutate(y);
    $[0] = foo;
    $[1] = bar;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["foo", "bar"],
};

```
      
### Eval output
(kind: ok) {"bar":"bar","wat0":"joe"}