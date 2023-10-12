
## Input

```javascript
function bar(a, b) {
  let x = [a, b];
  let y = {};
  let t = {};
  (function () {
    y = x[0][1];
    t = x[1][0];
  })();

  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: bar,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function bar(a, b) {
  const $ = useMemoCache(3);
  let y;
  if ($[0] !== a || $[1] !== b) {
    const x = [a, b];
    y = {};
    let t;
    t = {};

    y;
    t;
    y = x[0][1];
    t = x[1][0];
    $[0] = a;
    $[1] = b;
    $[2] = y;
  } else {
    y = $[2];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: bar,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      