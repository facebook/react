
## Input

```javascript
import { useEffect } from "react";

function Component() {
  let local;

  const reassignLocal = (newValue) => {
    local = newValue;
  };

  const onMount = (newValue) => {
    reassignLocal("hello");

    if (local === newValue) {
      // Without React Compiler, `reassignLocal` is freshly created
      // on each render, capturing a binding to the latest `local`,
      // such that invoking reassignLocal will reassign the same
      // binding that we are observing in the if condition, and
      // we reach this branch
      console.log("`local` was updated!");
    } else {
      // With React Compiler enabled, `reassignLocal` is only created
      // once, capturing a binding to `local` in that render pass.
      // Therefore, calling `reassignLocal` will reassign the wrong
      // version of `local`, and not update the binding we are checking
      // in the if condition.
      //
      // To protect against this, we disallow reassigning locals from
      // functions that escape
      throw new Error("`local` not updated!");
    }
  };

  useEffect(() => {
    onMount();
  }, [onMount]);

  return "ok";
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useEffect } from "react";

function Component() {
  const $ = _c(4);
  let local;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (newValue) => {
      local = newValue;
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const reassignLocal = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = (newValue_0) => {
      reassignLocal("hello");
      if (local === newValue_0) {
        console.log("`local` was updated!");
      } else {
        throw new Error("`local` not updated!");
      }
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const onMount = t1;
  let t2;
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = () => {
      onMount();
    };
    t3 = [onMount];
    $[2] = t2;
    $[3] = t3;
  } else {
    t2 = $[2];
    t3 = $[3];
  }
  useEffect(t2, t3);
  return "ok";
}

```
      