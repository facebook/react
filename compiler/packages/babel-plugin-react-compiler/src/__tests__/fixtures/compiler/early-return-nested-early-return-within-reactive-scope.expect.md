
## Input

```javascript
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
  params: [{cond: true, a: 42, b: 3.14}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props) {
    t0 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const x = [];
      if (props.cond) {
        x.push(props.a);
        if (props.b) {
          let t1;
          if ($[2] !== props.b) {
            t1 = [props.b];
            $[2] = props.b;
            $[3] = t1;
          } else {
            t1 = $[3];
          }
          const y = t1;
          x.push(y);
          t0 = x;
          break bb0;
        }

        t0 = x;
        break bb0;
      } else {
        let t1;
        if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
          t1 = foo();
          $[4] = t1;
        } else {
          t1 = $[4];
        }
        t0 = t1;
        break bb0;
      }
    }
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  if (t0 !== Symbol.for("react.early_return_sentinel")) {
    return t0;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, a: 42, b: 3.14 }],
};

```
      
### Eval output
(kind: ok) [42,[3.14]]