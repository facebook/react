
## Input

```javascript
// Check that we correctly resolve type and effect lookups on the javascript
// global object.
function Component(props) {
  let neverAliasedOrMutated = foo(props.b);
  let primitiveVal1 = Math.max(props.a, neverAliasedOrMutated);
  let primitiveVal2 = Infinity;
  let primitiveVal3 = globaThis.globalThis.NaN;

  // Even though we don't know the function signature of foo,
  // we should be able to infer that it does not mutate its inputs.
  foo(primitiveVal1, primitiveVal2, primitiveVal3);
  return { primitiveVal1, primitiveVal2, primitiveVal3 };
}

```

## Code

```javascript
import * as React from "react"; // Check that we correctly resolve type and effect lookups on the javascript
// global object.
function Component(props) {
  const $ = React.unstable_useMemoCache(7);
  const c_0 = $[0] !== props.b;
  let t0;
  if (c_0) {
    t0 = foo(props.b);
    $[0] = props.b;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const neverAliasedOrMutated = t0;
  const c_2 = $[2] !== props.a;
  const c_3 = $[3] !== neverAliasedOrMutated;
  let t1;
  if (c_2 || c_3) {
    t1 = Math.max(props.a, neverAliasedOrMutated);
    $[2] = props.a;
    $[3] = neverAliasedOrMutated;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  const primitiveVal1 = t1;
  const primitiveVal2 = Infinity;
  const primitiveVal3 = globaThis.globalThis.NaN;

  foo(primitiveVal1, primitiveVal2, primitiveVal3);
  const c_5 = $[5] !== primitiveVal1;
  let t2;
  if (c_5) {
    t2 = { primitiveVal1, primitiveVal2, primitiveVal3 };
    $[5] = primitiveVal1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      