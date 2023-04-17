
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
import * as React from "react"; // This tests an optimization, NOT a correctness property.
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
  const $ = React.unstable_useMemoCache(7);
  const c_0 = $[0] !== props.a.b;
  let y;
  if (c_0) {
    y = {};
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
    $[0] = props.a.b;
    $[1] = y;
  } else {
    y = $[1];
  }
  const c_4 = $[4] !== x;
  const c_5 = $[5] !== y;
  let t0;
  if (c_4 || c_5) {
    t0 = [x, y];
    $[4] = x;
    $[5] = y;
    $[6] = t0;
  } else {
    t0 = $[6];
  }
  return t0;
}

```
      