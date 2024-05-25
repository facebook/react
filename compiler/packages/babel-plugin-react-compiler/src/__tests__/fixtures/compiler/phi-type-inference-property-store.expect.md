
## Input

```javascript
// @debug
function Component(props) {
  const x = {};
  let y;
  if (props.cond) {
    y = {};
  } else {
    y = { a: props.a };
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
  params: [{ cond: false, a: "a!" }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @debug
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    const x = {};
    let y;
    if (props.cond) {
      y = {};
    } else {
      y = { a: props.a };
    }

    t0 = [x, y];
    y.x = x;
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: false, a: "a!" }],
};

```
      
### Eval output
(kind: ok) [{},{"a":"a!","x":"[[ cyclic ref *1 ]]"}]