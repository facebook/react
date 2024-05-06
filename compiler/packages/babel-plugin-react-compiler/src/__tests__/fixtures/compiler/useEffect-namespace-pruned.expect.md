
## Input

```javascript
import * as React from "react";

function someGlobal() {}
function useFoo() {
  const fn = React.useMemo(
    () =>
      function () {
        someGlobal();
      },
    []
  );
  React.useEffect(() => {
    fn();
  }, [fn]);

  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
  isComponent: false,
};

```

## Code

```javascript
import { c as useMemoCache } from "react/compiler-runtime";
import * as React from "react";

function someGlobal() {}
function useFoo() {
  const $ = useMemoCache(3);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = function () {
      someGlobal();
    };
    $[0] = t1;
  } else {
    t1 = $[0];
  }
  t0 = t1;
  const fn = t0;
  let t2;
  let t3;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      fn();
    };
    t3 = [fn];
    $[1] = t2;
    $[2] = t3;
  } else {
    t2 = $[1];
    t3 = $[2];
  }
  React.useEffect(t2, t3);
  return null;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) null