
## Input

```javascript
// @enableChangeDetectionForDebugging
import { useState } from "react";

function Component(props) {
  const [x, _] = useState(f(props.x));
  return <div>{x}</div>;
}

```

## Code

```javascript
import { $structuralCheck } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableChangeDetectionForDebugging
import { useState } from "react";

function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = f(props.x);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t1 = useState(t0);
  let x;
  {
    [x] = t1;
    let condition = $[1] !== t1;
    if (!condition) {
      let old$x = $[2];
      $structuralCheck(old$x, x, "x", "Component", "cached", "(5:5)");
    }
    $[1] = t1;
    $[2] = x;
    if (condition) {
      [x] = t1;
      $structuralCheck($[2], x, "x", "Component", "recomputed", "(5:5)");
      x = $[2];
    }
  }
  let t2;
  {
    t2 = <div>{x}</div>;
    let condition = $[3] !== x;
    if (!condition) {
      let old$t2 = $[4];
      $structuralCheck(old$t2, t2, "t2", "Component", "cached", "(6:6)");
    }
    $[3] = x;
    $[4] = t2;
    if (condition) {
      t2 = <div>{x}</div>;
      $structuralCheck($[4], t2, "t2", "Component", "recomputed", "(6:6)");
      t2 = $[4];
    }
  }
  return t2;
}

```
      