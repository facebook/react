
## Input

```javascript
// @enableEarlyReturnInReactiveScopes
import { makeArray } from "shared-runtime";

function Component(props) {
  let x = [];
  if (props.cond) {
    x.push(props.a);
    // oops no memo!
    return x;
  } else {
    return makeArray(props.b);
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    // pattern 1
    { cond: true, a: 42 },
    { cond: true, a: 42 },
    // pattern 2
    { cond: false, b: 3.14 },
    { cond: false, b: 3.14 },
    // pattern 1
    { cond: true, a: 42 },
    // pattern 2
    { cond: false, b: 3.14 },
    // pattern 1
    { cond: true, a: 42 },
    // pattern 2
    { cond: false, b: 3.14 },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEarlyReturnInReactiveScopes
import { makeArray } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(4);
  let t33;
  if ($[0] !== props) {
    t33 = Symbol.for("react.memo_cache_sentinel");
    bb8: {
      const x = [];
      if (props.cond) {
        x.push(props.a);
        t33 = x;
        break bb8;
      } else {
        let t0;
        if ($[2] !== props.b) {
          t0 = makeArray(props.b);
          $[2] = props.b;
          $[3] = t0;
        } else {
          t0 = $[3];
        }
        t33 = t0;
        break bb8;
      }
    }
    $[0] = props;
    $[1] = t33;
  } else {
    t33 = $[1];
  }
  if (t33 !== Symbol.for("react.memo_cache_sentinel")) {
    return t33;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  sequentialRenders: [
    // pattern 1
    { cond: true, a: 42 },
    { cond: true, a: 42 },
    // pattern 2
    { cond: false, b: 3.14 },
    { cond: false, b: 3.14 },
    // pattern 1
    { cond: true, a: 42 },
    // pattern 2
    { cond: false, b: 3.14 },
    // pattern 1
    { cond: true, a: 42 },
    // pattern 2
    { cond: false, b: 3.14 },
  ],
};

```
      
### Eval output
(kind: ok) [42]
[42]
[3.14]
[3.14]
[42]
[3.14]
[42]
[3.14]