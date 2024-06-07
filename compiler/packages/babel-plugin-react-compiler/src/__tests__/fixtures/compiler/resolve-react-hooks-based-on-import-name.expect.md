
## Input

```javascript
import { useState as useReactState } from "react";

function Component() {
  const [state, setState] = useReactState(0);

  const onClick = () => {
    setState((s) => s + 1);
  };

  return (
    <>
      Count {state}
      <button onClick={onClick}>Increment</button>
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
import { c as _c } from "react/compiler-runtime";
import { useState as useReactState } from "react";

function Component() {
  const $ = _c(3);
  const [state, setState] = useReactState(0);
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
        Count {state}
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

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) Count 0<button>Increment</button>