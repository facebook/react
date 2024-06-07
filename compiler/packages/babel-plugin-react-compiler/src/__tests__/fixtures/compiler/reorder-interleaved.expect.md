
## Input

```javascript
function Component(props) {
  const a = [];
  const b = [];
  a.push(props.a);
  b.push(props.b);
  return [a, b];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(7);
  let t0;
  if ($[0] !== props.a) {
    const a = [];

    a.push(props.a);

    t0 = a;
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[2] !== props.b) {
    const b = [];
    b.push(props.b);
    t1 = b;
    $[2] = props.b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== t0 || $[5] !== t1) {
    t2 = [t0, t1];
    $[4] = t0;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented