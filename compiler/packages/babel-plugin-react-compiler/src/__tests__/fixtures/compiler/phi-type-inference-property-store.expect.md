
## Input

```javascript
// @debug
function Component(props) {
  const x = {};
  let y;
  if (props.cond) {
    y = {};
  } else {
    y = {a: props.a};
  }
  // This should be inferred as `<store> y` s.t. `x` can still
  // be independently memoized. *But* this also must properly
  // extend the mutable range of the object literals in the
  // if/else branches
  y.x = x;

  return [x, y];
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: false, a: 'a!'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @debug
function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = {};
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const x = t0;
  let y;
  if ($[1] !== props) {
    if (props.cond) {
      y = {};
    } else {
      y = { a: props.a };
    }

    y.x = x;
    $[1] = props;
    $[2] = y;
  } else {
    y = $[2];
  }
  let t1;
  if ($[3] !== y) {
    t1 = [x, y];
    $[3] = y;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false, a: "a!" }],
};

```
      
### Eval output
(kind: ok) [{},{"a":"a!","x":"[[ cyclic ref *1 ]]"}]