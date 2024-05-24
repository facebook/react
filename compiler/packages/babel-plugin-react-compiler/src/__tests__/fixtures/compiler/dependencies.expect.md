
## Input

```javascript
function foo(x, y, z) {
  const items = [z];
  items.push(x);

  const items2 = [];
  if (x) {
    items2.push(y);
  }

  if (y) {
    items.push(x);
  }

  return items2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(x, y, z) {
  const $ = _c(4);
  let items2;
  if ($[0] !== z || $[1] !== x || $[2] !== y) {
    items2 = [];
    const items = [z];
    items.push(x);
    if (x) {
      items2.push(y);
    }
    if (y) {
      items.push(x);
    }
    $[0] = z;
    $[1] = x;
    $[2] = y;
    $[3] = items2;
  } else {
    items2 = $[3];
  }
  return items2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      