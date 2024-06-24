
## Input

```javascript
// @enableInstructionReordering
import { useState } from "react";

function Component() {
  const [state, setState] = useState(0);
  const onClick = () => {
    setState((s) => s + 1);
  };
  return (
    <>
      <span>Count: {state}</span>
      <button onClick={onClick}>Increment</button>
    </>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableInstructionReordering
import { useState } from "react";

function Component() {
  const $ = _c(6);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      setState((s) => s + 1);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const onClick = t0;
  let t1;
  if ($[1] !== state) {
    t1 = <span>Count: {state}</span>;
    $[1] = state;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <button onClick={onClick}>Increment</button>;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1) {
    t3 = (
      <>
        {t1}
        {t2}
      </>
    );
    $[4] = t1;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented