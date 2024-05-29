
## Input

```javascript
import { useState } from "react";

function useOther(x) {
  return x;
}

function Component(props) {
  const w = f(props.x);
  const z = useOther(w);
  const [x, _] = useState(z);
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

function useOther(x) {
  return x;
}

function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.x) {
    t0 = f(props.x);
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const w = t0;
  const z = useOther(w);
  const [x] = useState(z);
  let t1;
  if ($[2] !== x) {
    t1 = <div>{x}</div>;
    $[2] = x;
    $[3] = t1;
  } else {
    t1 = $[3];
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