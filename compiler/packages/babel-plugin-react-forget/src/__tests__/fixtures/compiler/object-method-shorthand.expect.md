
## Input

```javascript
function Component() {
  let obj = {
    method() {
      return 1;
    },
  };
  return obj.method();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }, { a: 2 }, { b: 2 }],
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
function Component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const obj = {
      method() {
        return 1;
      },
    };

    t0 = obj.method();
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }, { a: 2 }, { b: 2 }],
};

```
      
### Eval output
(kind: ok) 1