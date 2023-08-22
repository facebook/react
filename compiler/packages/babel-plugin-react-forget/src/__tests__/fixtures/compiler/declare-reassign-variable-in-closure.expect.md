
## Input

```javascript
function Component(p) {
  let x;
  const foo = () => {
    x = {};
  };
  foo();

  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(p) {
  const $ = useMemoCache(1);
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const foo = () => {
      x = {};
    };

    foo();
    $[0] = x;
  } else {
    x = $[0];
  }
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      