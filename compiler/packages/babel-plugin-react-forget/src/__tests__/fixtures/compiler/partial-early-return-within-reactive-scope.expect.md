
## Input

```javascript
// @enableEarlyReturnInReactiveScopes
function Component(props) {
  let x = [];
  let y = null;
  if (props.cond) {
    x.push(props.a);
    // oops no memo!
    return x;
  } else {
    y = foo();
    if (props.b) {
      return;
    }
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, a: 42 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEarlyReturnInReactiveScopes
function Component(props) {
  const $ = useMemoCache(4);
  let y;
  let t46;
  if ($[0] !== props) {
    t46 = Symbol.for("react.early_return_sentinel");
    bb11: {
      const x = [];
      if (props.cond) {
        x.push(props.a);
        t46 = x;
        break bb11;
      } else {
        let t0;
        if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
          t0 = foo();
          $[3] = t0;
        } else {
          t0 = $[3];
        }
        y = t0;
        if (props.b) {
          t46 = undefined;
          break bb11;
        }
      }
    }
    $[0] = props;
    $[1] = y;
    $[2] = t46;
  } else {
    y = $[1];
    t46 = $[2];
  }
  if (t46 !== Symbol.for("react.early_return_sentinel")) {
    return t46;
  }
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, a: 42 }],
};

```
      
### Eval output
(kind: ok) [42]