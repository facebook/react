
## Input

```javascript
// @enableInferEventHandlers
import {useRef} from 'react';

// Simulates a handler wrapper
function handleClick(value: any) {
  return () => {
    console.log(value);
  };
}

function Component() {
  const ref = useRef(null);

  // Allowed: we aren't sure that the ref.current value flows into the render
  // output, so we optimistically assume it's safe
  return (
    <>
      <input ref={ref} />
      <button onClick={handleClick(ref.current)}>Click</button>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableInferEventHandlers
import { useRef } from "react";

// Simulates a handler wrapper
function handleClick(value) {
  const $ = _c(2);
  let t0;
  if ($[0] !== value) {
    t0 = () => {
      console.log(value);
    };
    $[0] = value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

function Component() {
  const $ = _c(1);
  const ref = useRef(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <>
        <input ref={ref} />
        <button onClick={handleClick(ref.current)}>Click</button>
      </>
    );
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <input><button>Click</button>