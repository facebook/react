
## Input

```javascript
function foo(a, b, c, d) {
  let y = [];
  label: if (a) {
    if (b) {
      y.push(c);
      break label;
    }
    y.push(d);
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo(a, b, c, d) {
  const $ = useMemoCache(5);
  let y;
  if ($[0] !== a || $[1] !== b || $[2] !== c || $[3] !== d) {
    y = [];
    bb1: if (a) {
      if (b) {
        y.push(c);
        break bb1;
      }

      y.push(d);
    }
    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
    $[4] = y;
  } else {
    y = $[4];
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      