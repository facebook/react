
## Input

```javascript
import { useEffect, useState } from "react";

function Component() {
  const [state, setState] = useState("hello");
  useEffect(() => {
    setState("goodbye");
  }, []);

  return <div>{state}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useEffect, useState } from "react";

function Component() {
  const $ = _c(4);
  const [state, setState] = useState("hello");
  let t0;
  if ($[0] !== state) {
    t0 = <div>{state}</div>;
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      setState("goodbye");
    };
    t2 = [];
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>goodbye</div>