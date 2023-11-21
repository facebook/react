
## Input

```javascript
import { Stringify } from "shared-runtime";
function useFoo() {
  const MyLocal = Stringify;
  const callback = () => {
    return <MyLocal value={4} />;
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
import { unstable_useMemoCache as useMemoCache } from "react";
import { Stringify } from "shared-runtime";
function useFoo() {
  const $ = useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => <Stringify value={4} />;
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
(kind: ok) <div>{"value":4}</div>