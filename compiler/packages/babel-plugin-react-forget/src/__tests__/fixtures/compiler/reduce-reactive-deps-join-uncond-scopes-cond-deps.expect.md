
## Input

```javascript
// This tests an optimization, NOT a correctness property.
// When propagating reactive dependencies of an inner scope up to its parent,
// we prefer to retain granularity.
//
// In this test, we check that Forget propagates the inner scope's conditional
// dependencies (e.g. props.a.b) instead of only its derived minimal
// unconditional dependencies (e.g. props).
// ```javascript
//  scope @0 (deps=[???] decls=[x, y]) {
//    let y = {};
//    scope @1 (deps=[props] decls=[x]) {
//      let x = {};
//      if (foo) mutate1(x, props.a.b);
//    }
//    mutate2(y, props.a.b);
//  }

function TestJoinCondDepsInUncondScopes(props) {
  let y = {};
  let x = {};
  if (foo) {
    mutate1(x, props.a.b);
  }
  mutate2(y, props.a.b);
  return [x, y];
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // This tests an optimization, NOT a correctness property.
// When propagating reactive dependencies of an inner scope up to its parent,
// we prefer to retain granularity.
//
// In this test, we check that Forget propagates the inner scope's conditional
// dependencies (e.g. props.a.b) instead of only its derived minimal
// unconditional dependencies (e.g. props).
// ```javascript
//  scope @0 (deps=[???] decls=[x, y]) {
//    let y = {};
//    scope @1 (deps=[props] decls=[x]) {
//      let x = {};
//      if (foo) mutate1(x, props.a.b);
//    }
//    mutate2(y, props.a.b);
//  }

function TestJoinCondDepsInUncondScopes(props) {
  const $ = useMemoCache(4);
  const c_0 = $[0] !== props.a.b;
  let t0;
  if (c_0) {
    const y = {};
    const c_2 = $[2] !== props;
    let x;
    if (c_2) {
      x = {};
      if (foo) {
        mutate1(x, props.a.b);
      }
      $[2] = props;
      $[3] = x;
    } else {
      x = $[3];
    }

    mutate2(y, props.a.b);
    t0 = [x, y];
    $[0] = props.a.b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      