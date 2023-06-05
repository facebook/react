
## Input

```javascript
function useFreeze() {}
function foo() {}

function Component(props) {
  const x = [];
  const y = useFreeze(x);
  foo(y, x);
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function useFreeze() {}
function foo() {}

function Component(props) {
  const $ = useMemoCache(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  const y = useFreeze(x);
  foo(y, x);
  const c_1 = $[1] !== y;
  let t1;
  if (c_1) {
    t1 = (
      <Component>
        {x}
        {y}
      </Component>
    );
    $[1] = y;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      