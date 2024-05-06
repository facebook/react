
## Input

```javascript
function component() {
  let x = function (a) {
    a.foo();
  };
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
function component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = function (a) {
      a.foo();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) "[[ function params=1 ]]"