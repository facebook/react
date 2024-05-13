
## Input

```javascript
function Component(props) {
  const [a, b] = useMemo(() => {
    const items = [];
    const a = makeObject(props.a);
    const b = makeObject(props.b);
    return [a, b];
  });
  return [a, b];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(10);
  let t0;
  let t1;
  if ($[0] !== props.a) {
    t1 = makeObject(props.a);
    $[0] = props.a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const a = t1;
  let t2;
  if ($[2] !== props.b) {
    t2 = makeObject(props.b);
    $[2] = props.b;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const b = t2;
  let t3;
  if ($[4] !== a || $[5] !== b) {
    t3 = [a, b];
    $[4] = a;
    $[5] = b;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  t0 = t3;
  const [a_0, b_0] = t0;
  let t4;
  if ($[7] !== a_0 || $[8] !== b_0) {
    t4 = [a_0, b_0];
    $[7] = a_0;
    $[8] = b_0;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
}

```
      