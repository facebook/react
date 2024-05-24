
## Input

```javascript
function Component(props) {
  const f = (item) => item;
  const x = [...props.items].map(f); // `f` doesn't escape here...
  return [x, f]; // ...but it does here so it's memoized
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1 }] }],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(7);
  let t0;
  let f;
  if ($[0] !== props.items) {
    let t1;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (item) => item;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    f = t1;
    t0 = [...props.items].map(f);
    $[0] = props.items;
    $[1] = t0;
    $[2] = f;
  } else {
    t0 = $[1];
    f = $[2];
  }
  const x = t0;
  let t1;
  if ($[4] !== x || $[5] !== f) {
    t1 = [x, f];
    $[4] = x;
    $[5] = f;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1 }] }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [[{"id":1}],"[[ function params=1 ]]"]