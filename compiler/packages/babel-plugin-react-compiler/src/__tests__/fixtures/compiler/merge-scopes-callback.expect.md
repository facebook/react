
## Input

```javascript
// @enableInstructionReordering
import {useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  const onClick = () => {
    setState(s => s + 1);
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
  const $ = _c(4);
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
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = <button onClick={onClick}>Increment</button>;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== state) {
    t2 = (
      <>
        <span>Count: {state}</span>
        {t1}
      </>
    );
    $[2] = state;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented