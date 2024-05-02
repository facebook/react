
## Input

```javascript
import * as SharedRuntime from "shared-runtime";
function useFoo() {
  const MyLocal = SharedRuntime;
  const callback = () => {
    return <MyLocal.Text value={4} />;
  };
  return callback();
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```

## Code

```javascript
import { c as useMemoCache } from "react";
import * as SharedRuntime from "shared-runtime";
function useFoo() {
  const $ = useMemoCache(2);
  const MyLocal = SharedRuntime;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => <MyLocal.Text value={4} />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const callback = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = callback();
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [],
};

```
      
### Eval output
(kind: ok) <div>4</div>