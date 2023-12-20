
## Input

```javascript
// @enableEarlyReturnInReactiveScopes
function Component(props) {
  let x = [];
  if (props.cond) {
    x.push(props.a);
    // oops no memo!
    return x;
  } else {
    return foo();
  }
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
  const $ = useMemoCache(3);
  let t29;
  if ($[0] !== props) {
    t29 = Symbol.for("react.memo_cache_sentinel");
    bb8: {
      const x = [];
      if (props.cond) {
        x.push(props.a);
        t29 = x;
        break bb8;
      } else {
        let t0;
        if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
          t0 = foo();
          $[2] = t0;
        } else {
          t0 = $[2];
        }
        t29 = t0;
        break bb8;
      }
    }
    $[0] = props;
    $[1] = t29;
  } else {
    t29 = $[1];
  }
  if (t29 !== Symbol.for("react.memo_cache_sentinel")) {
    return t29;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, a: 42 }],
};

```
      
### Eval output
(kind: ok) [42]