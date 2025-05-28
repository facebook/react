
## Input

```javascript
// @enableNewMutationAliasingModel
function Component({a, b}) {
  const x = {a};
  const y = [b];
  const f = () => {
    y.x = x;
    mutate(y);
  };
  return <div onClick={f}>{x}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNewMutationAliasingModel
function Component(t0) {
  const $ = _c(7);
  const { a, b } = t0;
  let t1;
  let x;
  if ($[0] !== a || $[1] !== b) {
    x = { a };
    const y = [b];
    t1 = () => {
      y.x = x;
      mutate(y);
    };
    $[0] = a;
    $[1] = b;
    $[2] = t1;
    $[3] = x;
  } else {
    t1 = $[2];
    x = $[3];
  }
  const f = t1;
  let t2;
  if ($[4] !== f || $[5] !== x) {
    t2 = <div onClick={f}>{x}</div>;
    $[4] = f;
    $[5] = x;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  return t2;
}

```
      
### Eval output
(kind: exception) Fixture not implemented