
## Input

```javascript
const { mutate } = require("shared-runtime");

function component(a) {
  let x = { a };
  let y = {};
  (function () {
    y["x"] = x;
  })();
  mutate(y);
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["foo"],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
const { mutate } = require("shared-runtime");

function component(a) {
  const $ = _c(2);
  let t0;
  if ($[0] !== a) {
    const x = { a };
    const y = {};

    y.x = x;

    t0 = y;
    mutate(y);
    $[0] = a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["foo"],
};

```
      
### Eval output
(kind: ok) {"x":{"a":"foo"},"wat0":"joe"}