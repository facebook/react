
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
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (item) => item;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  let f;
  if ($[1] !== props.items) {
    f = t0;
    t1 = [...props.items].map(f);
    $[1] = props.items;
    $[2] = t1;
    $[3] = f;
  } else {
    t1 = $[2];
    f = $[3];
  }
  const x = t1;
  let t2;
  if ($[4] !== x || $[5] !== f) {
    t2 = [x, f];
    $[4] = x;
    $[5] = f;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1 }] }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [[{"id":1}],"[[ function params=1 ]]"]