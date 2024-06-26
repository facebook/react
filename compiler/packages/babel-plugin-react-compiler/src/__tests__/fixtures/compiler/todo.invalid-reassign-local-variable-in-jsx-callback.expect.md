
## Input

```javascript
function Component() {
  let local;

  const reassignLocal = (newValue) => {
    local = newValue;
  };

  const onClick = (newValue) => {
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

  return <button onClick={onClick}>Submit</button>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(2);
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
    const onClick = (newValue_0) => {
      reassignLocal("hello");
      if (local === newValue_0) {
        console.log("`local` was updated!");
      } else {
        throw new Error("`local` not updated!");
      }
    };

    t1 = <button onClick={onClick}>Submit</button>;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

```
      