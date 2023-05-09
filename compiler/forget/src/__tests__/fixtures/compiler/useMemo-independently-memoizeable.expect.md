
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(10);
  const c_0 = $[0] !== props.a;
  let t0;
  if (c_0) {
    t0 = makeObject(props.a);
    $[0] = props.a;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const a = t0;
  const c_2 = $[2] !== props.b;
  let t1;
  if (c_2) {
    t1 = makeObject(props.b);
    $[2] = props.b;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const b = t1;
  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  let t2;
  if (c_4 || c_5) {
    t2 = [a, b];
    $[4] = a;
    $[5] = b;
    $[6] = t2;
  } else {
    t2 = $[6];
  }
  const t27 = t2;
  const [a_0, b_0] = t27;
  const c_7 = $[7] !== a_0;
  const c_8 = $[8] !== b_0;
  let t3;
  if (c_7 || c_8) {
    t3 = [a_0, b_0];
    $[7] = a_0;
    $[8] = b_0;
    $[9] = t3;
  } else {
    t3 = $[9];
  }
  return t3;
}

```
      