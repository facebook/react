
## Input

```javascript
function Component(props) {
  const x = [props.x];
  const index = 0;
  x[index] *= 2;
  x["0"] += 3;
  return x;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 2 }],
  isComponent: false,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.x) {
    const x = [props.x];

    t0 = x;
    x[0] = x[0] * 2;
    x["0"] = x["0"] + 3;
    $[0] = props.x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 2 }],
  isComponent: false,
};

```
      
### Eval output
(kind: ok) [7]