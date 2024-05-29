
## Input

```javascript
import { useState } from "react";

function Component(props) {
  const w = f(props.x);
  const [x, _] = useState(w);
  return (
    <div>
      {x}
      {w}
    </div>
  );
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
  const $ = _c(5);
  let t0;
  if ($[0] !== props.x) {
    t0 = f(props.x);
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const w = t0;
  const [x] = useState(w);
  let t1;
  if ($[2] !== x || $[3] !== w) {
    t1 = (
      <div>
        {x}
        {w}
      </div>
    );
    $[2] = x;
    $[3] = w;
    $[4] = t1;
  } else {
    t1 = $[4];
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
(kind: ok) <div>4242</div>