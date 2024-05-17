
## Input

```javascript
function component(a) {
  let x = useMemo(() => [a], [a]);
  return <Foo x={x}></Foo>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component(a) {
  const $ = _c(4);
  let t0;
  let t1;
  if ($[0] !== a) {
    t1 = [a];
    $[0] = a;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  const x = t0;
  let t2;
  if ($[2] !== x) {
    t2 = <Foo x={x} />;
    $[2] = x;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

```
      