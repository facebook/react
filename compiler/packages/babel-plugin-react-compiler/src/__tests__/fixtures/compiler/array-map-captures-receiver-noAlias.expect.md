
## Input

```javascript
function Component(props) {
  // This item is part of the receiver, should be memoized
  const item = {a: props.a};
  const items = [item];
  const mapped = items.map(item => item);
  return mapped;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{a: {id: 42}}],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(6);
  let t0;
  if ($[0] !== props.a) {
    t0 = { a: props.a };
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const item = t0;
  let t1;
  if ($[2] !== item) {
    t1 = [item];
    $[2] = item;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const items = t1;
  let t2;
  if ($[4] !== items) {
    t2 = items.map(_temp);
    $[4] = items;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const mapped = t2;
  return mapped;
}
function _temp(item_0) {
  return item_0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ a: { id: 42 } }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [{"a":{"id":42}}]