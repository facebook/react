
## Input

```javascript
// @enableInstructionReordering

function Component(props) {
  const x = [];
  const a = props.a;
  x.push(props.a);
  const b = a.b;
  x.push(props.b);
  const c = b.c;
  x.push(props.c);
  const d = c.d;
  x.push(props.d);
  return [d, x];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableInstructionReordering

function Component(props) {
  const $ = _c(8);
  let x;
  if (
    $[0] !== props.a ||
    $[1] !== props.b ||
    $[2] !== props.c ||
    $[3] !== props.d
  ) {
    x = [];

    x.push(props.a);

    x.push(props.b);

    x.push(props.c);

    x.push(props.d);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = props.d;
    $[4] = x;
  } else {
    x = $[4];
  }
  const a = props.a;
  const b = a.b;
  const c = b.c;
  const d = c.d;
  let t0;
  if ($[5] !== d || $[6] !== x) {
    t0 = [d, x];
    $[5] = d;
    $[6] = x;
    $[7] = t0;
  } else {
    t0 = $[7];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented