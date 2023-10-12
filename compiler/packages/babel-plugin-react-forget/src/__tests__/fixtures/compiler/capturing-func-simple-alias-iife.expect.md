
## Input

```javascript
const { mutate } = require("shared-runtime");

function component(a) {
  let x = { a };
  let y = {};
  (function () {
    y = x;
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
import { unstable_useMemoCache as useMemoCache } from "react";
const { mutate } = require("shared-runtime");

function component(a) {
  const $ = useMemoCache(2);
  let y;
  if ($[0] !== a) {
    const x = { a };
    y = {};

    y;
    y = x;

    mutate(y);
    $[0] = a;
    $[1] = y;
  } else {
    y = $[1];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["foo"],
};

```
      