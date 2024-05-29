
## Input

```javascript
import { useState } from "react";

function Component(props) {
  const w = f(props.x);
  const [x, _] = useState(w);
  return <div>{x}</div>;
}

function f(x) {
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

function Component(props) {
  const $ = _c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = f(props.x);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const w = t0;
  const [x] = useState(w);
  let t1;
  if ($[1] !== x) {
    t1 = <div>{x}</div>;
    $[1] = x;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

function f(x) {
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 42 }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div>42</div>