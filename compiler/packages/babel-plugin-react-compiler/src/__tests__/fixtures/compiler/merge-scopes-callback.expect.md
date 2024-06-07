
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
  const $ = _c(3);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const onClick = () => {
      setState((s) => s + 1);
    };

    t0 = <button onClick={onClick}>Increment</button>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] !== state) {
    t1 = (
      <>
        <span>Count: {state}</span>
        {t0}
      </>
    );
    $[1] = state;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      
### Eval output
(kind: exception) Fixture not implemented