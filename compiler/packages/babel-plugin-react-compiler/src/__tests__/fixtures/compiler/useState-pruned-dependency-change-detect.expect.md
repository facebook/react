
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
  const $ = _c(2);
  const [x] = useState(f(props.x));
  let t0;
  {
    t0 = <div>{x}</div>;
    let condition = $[0] !== x;
    if (!condition) {
      let old$t0 = $[1];
      $structuralCheck(old$t0, t0, "t0", "Component", "cached", "(6:6)");
    }
    $[0] = x;
    $[1] = t0;
    if (condition) {
      t0 = <div>{x}</div>;
      $structuralCheck($[1], t0, "t0", "Component", "recomputed", "(6:6)");
      t0 = $[1];
    }
  }
  return t0;
}

```
      