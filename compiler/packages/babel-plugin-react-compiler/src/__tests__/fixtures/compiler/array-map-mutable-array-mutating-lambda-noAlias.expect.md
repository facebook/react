
## Input

```javascript
function Component(props) {
  const x = [];
  const y = x.map((item) => {
    item.updated = true;
    return item;
  });
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
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let t0;
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    t0 = x.map((item) => {
      item.updated = true;
      return item;
    });
    $[0] = t0;
    $[1] = x;
  } else {
    t0 = $[0];
    x = $[1];
  }
  const y = t0;
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [x, y];
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [[],[]]