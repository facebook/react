
## Input

```javascript
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
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

function Component() {
  const $ = _c(5);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] !== state) {
    t0 = <span>Count: {state}</span>;
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    const onClick = () => {
      setState((s) => s + 1);
    };
    t1 = <button onClick={onClick}>Increment</button>;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== t0) {
    t2 = (
      <>
        {t0}
        {t1}
      </>
    );
    $[3] = t0;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented