
## Input

```javascript
let x = {};
function Component() {
  React.useEffect(() => {
    x.foo = 1;
  });
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
let x = {};
function Component() {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      x.foo = 1;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  React.useEffect(t0);
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 