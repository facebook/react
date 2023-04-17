
## Input

```javascript
// Should print A, B, arg, original
function changeF(o) {
  o.f = () => console.log("new");
}

function Component() {
  let x = {
    f: () => console.log("original"),
  };

  (console.log("A"), x)[(console.log("B"), "f")](
    (changeF(x), console.log("arg"), 1)
  );
  return x;
}

```

## Code

```javascript
import * as React from "react"; // Should print A, B, arg, original
function changeF(o) {
  o.f = () => console.log("new");
  return undefined;
}

function Component() {
  const $ = React.unstable_useMemoCache(2);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => console.log("original");
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let x;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    x = { f: t0 };

    console.log("A");
    console.log("B");
    changeF(x);
    console.log("arg");
    x.f(1);
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      