
## Input

```javascript
// @enableReactiveGraph
function Component(props) {
  let element = props.default;
  let other = element;
  if (props.cond) {
    element = <div></div>;
  } else {
    element = <span></span>;
  }
  return [element, other];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableReactiveGraph
function Component(props) {
  const $ = _c(5);
  let element = props.default;
  const other = element;
  if (props.cond) {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <div />;
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    element = t0;
  } else {
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <span />;
      $[1] = t0;
    } else {
      t0 = $[1];
    }
    element = t0;
  }
  let t0;
  if ($[2] !== element || $[3] !== other) {
    t0 = [element, other];
    $[2] = element;
    $[3] = other;
    $[4] = t0;
  } else {
    t0 = $[4];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented