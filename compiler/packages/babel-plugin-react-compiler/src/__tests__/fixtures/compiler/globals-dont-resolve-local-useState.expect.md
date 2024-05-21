
## Input

```javascript
import { useState as _useState, useCallback, useEffect } from "react";
import { ValidateMemoization } from "shared-runtime";

function useState(value) {
  const [state, setState] = _useState(value);
  return [state, setState];
}

function Component() {
  const [state, setState] = useState("hello");

  return <div onClick={() => setState("goodbye")}>{state}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState as _useState, useCallback, useEffect } from "react";
import { ValidateMemoization } from "shared-runtime";

function useState(value) {
  const $ = _c(5);
  let t0;
  if ($[0] !== value) {
    t0 = _useState(value);
    $[0] = value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const [state, setState] = t0;
  let t1;
  if ($[2] !== state || $[3] !== setState) {
    t1 = [state, setState];
    $[2] = state;
    $[3] = setState;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

function Component() {
  const $ = _c(5);
  const [state, setState] = useState("hello");
  let t0;
  if ($[0] !== setState) {
    t0 = () => setState("goodbye");
    $[0] = setState;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== t0 || $[3] !== state) {
    t1 = <div onClick={t0}>{state}</div>;
    $[2] = t0;
    $[3] = state;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>hello</div>