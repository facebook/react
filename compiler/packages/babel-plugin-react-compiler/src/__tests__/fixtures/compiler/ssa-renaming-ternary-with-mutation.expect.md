
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  props.cond ? ((x = {}), (x = []), x.push(props.foo)) : null;
  mut(x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props) {
    let x = [];
    x.push(props.bar);
    props.cond ? ((x = []), x.push(props.foo)) : null;

    t0 = x;
    mut(x);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      