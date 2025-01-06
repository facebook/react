
## Input

```javascript
// @enableReactiveGraph
function Component(props) {
  const x = [];
  const y = [];
  if (props.condition) {
    x.push(props.x);
  }
  y.push(props.y);
  return [x, y];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableReactiveGraph
function Component(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.condition || $[1] !== props.x || $[2] !== props.y) {
    const x = [];
    const y = [];
    if (props.condition) {
      x.push(props.x);
    }

    y.push(props.y);
    t0 = [x, y];
    $[0] = props.condition;
    $[1] = props.x;
    $[2] = props.y;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented