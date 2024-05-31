
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
  const $ = _c(4);
  let t0;
  {
    t0 = f(props.x);
    if (!($[0] !== props.x)) {
      let old$t0;
      old$t0 = $[1];
      $structuralCheck(old$t0, t0, "t0", "Component");
      t0 = old$t0;
    }
    $[0] = props.x;
    $[1] = t0;
  }
  const [x] = useState(t0);
  let t1;
  {
    t1 = <div>{x}</div>;
    if (!($[2] !== x)) {
      let old$t1;
      old$t1 = $[3];
      $structuralCheck(old$t1, t1, "t1", "Component");
      t1 = old$t1;
    }
    $[2] = x;
    $[3] = t1;
  }
  return t1;
}

```
      