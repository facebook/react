
## Input

```javascript
function component(a, b) {
  let x = useMemo(() => {
    if (a) {
      return { b };
    }
  }, [a, b]);
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function component(a, b) {
  const $ = useMemoCache(2);
  let t13;
  bb6: {
    if (a) {
      let t0;
      if ($[0] !== b) {
        t0 = { b };
        $[0] = b;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      t13 = t0;
      break bb6;
    }
    t13 = undefined;
  }
  const x = t13;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      