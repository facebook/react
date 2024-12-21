
## Input

```javascript
import * as React from 'react';

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
import { c as _c } from "react/compiler-runtime";
import * as React from "react";

function someGlobal() {}
function useFoo() {
  const $ = _c(2);
  let t0;
  t0 = _temp;
  const fn = t0;
  let t1;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      fn();
    };
    t2 = [fn];
    $[0] = t1;
    $[1] = t2;
  } else {
    t1 = $[0];
    t2 = $[1];
  }
  React.useEffect(t1, t2);
  return null;
}
function _temp() {
  someGlobal();
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) null