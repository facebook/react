
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
  const $ = useMemoCache(8);
  const c_0 = $[0] !== props.a.b;
  let x;
  let y;
  if (c_0) {
    y = {};
    const c_3 = $[3] !== props;
    if (c_3) {
      x = {};
      if (foo) {
        mutate1(x, props.a.b);
      }
      $[3] = props;
      $[4] = x;
    } else {
      x = $[4];
    }

    mutate2(y, props.a.b);
    $[0] = props.a.b;
    $[1] = x;
    $[2] = y;
  } else {
    x = $[1];
    y = $[2];
  }
  const c_5 = $[5] !== x;
  const c_6 = $[6] !== y;
  let t0;
  if (c_5 || c_6) {
    t0 = [x, y];
    $[5] = x;
    $[6] = y;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      