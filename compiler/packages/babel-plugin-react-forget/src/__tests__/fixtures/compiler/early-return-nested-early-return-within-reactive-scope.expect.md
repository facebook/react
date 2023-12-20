
## Input

```javascript
// @enableEarlyReturnInReactiveScopes
function Component(props) {
  let x = [];
  if (props.cond) {
    x.push(props.a);
    if (props.b) {
      const y = [props.b];
      x.push(y);
      // oops no memo!
      return x;
    }
    // oops no memo!
    return x;
  } else {
    return foo();
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, a: 42, b: 3.14 }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEarlyReturnInReactiveScopes
function Component(props) {
  const $ = useMemoCache(5);
  let t53;
  if ($[0] !== props) {
    t53 = Symbol.for("react.memo_cache_sentinel");
    bb11: {
      const x = [];
      if (props.cond) {
        x.push(props.a);
        if (props.b) {
          let t0;
          if ($[2] !== props.b) {
            t0 = [props.b];
            $[2] = props.b;
            $[3] = t0;
          } else {
            t0 = $[3];
          }
          const y = t0;
          x.push(y);
          t53 = x;
          break bb11;
        }

        t53 = x;
        break bb11;
      } else {
        let t1;
        if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
          t1 = foo();
          $[4] = t1;
        } else {
          t1 = $[4];
        }
        t53 = t1;
        break bb11;
      }
    }
    $[0] = props;
    $[1] = t53;
  } else {
    t53 = $[1];
  }
  if (t53 !== Symbol.for("react.memo_cache_sentinel")) {
    return t53;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, a: 42, b: 3.14 }],
};

```
      
### Eval output
(kind: ok) [42,[3.14]]