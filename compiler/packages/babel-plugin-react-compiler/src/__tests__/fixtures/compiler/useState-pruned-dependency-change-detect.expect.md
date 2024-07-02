
## Input

```javascript
// @enableChangeDetection
import { useState } from "react";

function Component(props) {
  const [x, _] = useState(f(props.x));
  return <div>{x}</div>;
}

```

## Code

```javascript
import { $structuralCheck } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @enableChangeDetection
import { useState } from "react";

function Component(props) {
  const $ = _c(6);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = props.x;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = f(t0);
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = useState(t1);
  let x;
  {
    [x] = t2;
    let condition = $[2] !== t2;
    if (!condition) {
      let old$x = $[3];
      $structuralCheck(old$x, x, "x", "Component", "cached", "(5:5)");
      x = old$x;
    }
    $[2] = t2;
    $[3] = x;
    if (condition) {
      [x] = t2;
      $structuralCheck($[3], x, "x", "Component", "recomputed", "(5:5)");
      x = $[3];
    }
  }
  let t3;
  {
    t3 = <div>{x}</div>;
    let condition = $[4] !== x;
    if (!condition) {
      let old$t3 = $[5];
      $structuralCheck(old$t3, t3, "t3", "Component", "cached", "(6:6)");
      t3 = old$t3;
    }
    $[4] = x;
    $[5] = t3;
    if (condition) {
      t3 = <div>{x}</div>;
      $structuralCheck($[5], t3, "t3", "Component", "recomputed", "(6:6)");
      t3 = $[5];
    }
  }
  return t3;
}

```
      