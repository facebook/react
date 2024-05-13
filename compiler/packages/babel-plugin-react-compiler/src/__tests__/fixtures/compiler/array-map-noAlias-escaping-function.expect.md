
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
  const $ = _c(5);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (item) => item;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const f = t0;
  let t1;
  if ($[1] !== props.items) {
    t1 = [...props.items].map(f);
    $[1] = props.items;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const x = t1;
  let t2;
  if ($[3] !== x) {
    t2 = [x, f];
    $[3] = x;
    $[4] = t2;
  } else {
    t2 = $[4];
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