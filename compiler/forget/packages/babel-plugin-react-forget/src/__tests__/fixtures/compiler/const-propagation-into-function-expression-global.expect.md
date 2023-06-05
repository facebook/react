
## Input

```javascript
function foo() {
  const isX = GLOBAL_IS_X;
  const getJSX = () => {
    <Child x={isX}></Child>;
  };
  const result = getJSX();
  return result;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function foo() {
  const $ = useMemoCache(2);
  const isX = GLOBAL_IS_X;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      <Child x={isX}></Child>;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const getJSX = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = getJSX();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const result = t1;
  return result;
}

```
      