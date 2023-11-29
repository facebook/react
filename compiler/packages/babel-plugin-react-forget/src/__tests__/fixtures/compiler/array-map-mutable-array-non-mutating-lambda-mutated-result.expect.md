
## Input

```javascript
function Component(props) {
  const x = [{}];
  const y = x.map((item) => {
    return item;
  });
  y[0].flag = true;
  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  isComponent: false,
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const x = [{}];
    const y = x.map((item) => item);
    y[0].flag = true;
    t0 = [x, y];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [[{"flag":true}],["[[ cyclic ref *2 ]]"]]