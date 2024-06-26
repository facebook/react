
## Input

```javascript
function Component() {
  let value = null;
  const reassign = async () => {
    await foo().then((result) => {
      // Reassigning a local variable in an async function is *always* mutating
      // after render, so this should error regardless of where this ends up
      // getting called
      value = result;
    });
  };

  const onClick = async () => {
    await reassign();
  };
  return <div onClick={onClick}>Click</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component() {
  const $ = _c(2);
  let value;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    value = null;
    $[0] = value;
  } else {
    value = $[0];
  }
  let t0;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    const reassign = async () => {
      await foo().then((result) => {
        value = result;
      });
    };

    const onClick = async () => {
      await reassign();
    };

    t0 = <div onClick={onClick}>Click</div>;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      