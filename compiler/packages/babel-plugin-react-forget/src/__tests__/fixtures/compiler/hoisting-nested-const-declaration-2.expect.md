
## Input

```javascript
function hoisting(cond) {
  let items = [];
  if (cond) {
    const foo = () => {
      items.push(bar());
    };
    const bar = () => true;
    foo();
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [true],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function hoisting(cond) {
  const $ = useMemoCache(3);
  let items;
  if ($[0] !== cond) {
    items = [];
    if (cond) {
      const foo = () => {
        items.push(bar());
      };
      let t0;
      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = () => true;
        $[2] = t0;
      } else {
        t0 = $[2];
      }
      const bar = t0;
      foo();
    }
    $[0] = cond;
    $[1] = items;
  } else {
    items = $[1];
  }
  return items;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [true],
  isComponent: false,
};

```
      