
## Input

```javascript
import * as SharedRuntime from "shared-runtime";
function useFoo({ cond }) {
  const MyLocal = SharedRuntime;
  if (cond) {
    return <MyLocal.Text value={4} />;
  } else {
    return null;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ cond: true }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import * as SharedRuntime from "shared-runtime";
function useFoo(t12) {
  const $ = useMemoCache(1);
  const { cond } = t12;
  const MyLocal = SharedRuntime;
  if (cond) {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <MyLocal.Text value={4} />;
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    return t0;
  } else {
    return null;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: useFoo,
  params: [{ cond: true }],
};

```
      
### Eval output
(kind: ok) <div>4</div>