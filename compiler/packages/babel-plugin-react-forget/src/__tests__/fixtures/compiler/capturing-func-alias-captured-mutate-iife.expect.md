
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
import { unstable_useMemoCache as useMemoCache } from "react";
const { mutate } = require("shared-runtime");

function component(foo, bar) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== foo;
  const c_1 = $[1] !== bar;
  let y;
  if (c_0 || c_1) {
    const x = { foo };
    y = { bar };

    const a = { y };
    const b = x;
    a.x = b;

    mutate(y);
    $[0] = foo;
    $[1] = bar;
    $[2] = y;
  } else {
    y = $[2];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["foo", "bar"],
};

```
      