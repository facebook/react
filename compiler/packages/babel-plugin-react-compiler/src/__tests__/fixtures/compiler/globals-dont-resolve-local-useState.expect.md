
## Input

```javascript
import { useState as _useState } from "react";

function useState(value) {
  return _useState(value);
}

function Component() {
  const [state, setState] = useState("hello");

  return <div onClick={() => setState("bye")}>{state}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState as _useState } from "react";

function useState(value) {
  const $ = _c(2);
  let t0;
  if ($[0] !== value) {
    t0 = _useState(value);
    $[0] = value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

function Component() {
  const $ = _c(5);
  const [state, setState] = useState("hello");
  let t0;
  if ($[0] !== setState) {
    t0 = () => setState("bye");
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

```
      
### Eval output
(kind: exception) Fixture not implemented