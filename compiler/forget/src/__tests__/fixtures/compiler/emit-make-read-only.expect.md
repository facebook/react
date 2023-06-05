
## Input

```javascript
// @enableEmitFreeze true

function MyComponentName(props) {
  let x = {};
  foo(x, props.a);
  foo(x, props.b);

  let y = [];
  y.push(x);
  return y;
}

```

## Code

```javascript
import { makeReadOnly } from "react-forget-runtime-emit-freeze";
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEmitFreeze true

function MyComponentName(props) {
  const $ = useMemoCache(5);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let x;
  if (c_0 || c_1) {
    x = {};
    foo(x, props.a);
    foo(x, props.b);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = __DEV__ ? makeReadOnly(x, "MyComponentName") : x;
  } else {
    x = $[2];
  }
  const c_3 = $[3] !== x;
  let y;
  if (c_3) {
    y = [];
    y.push(x);
    $[3] = x;
    $[4] = __DEV__ ? makeReadOnly(y, "MyComponentName") : y;
  } else {
    y = $[4];
  }
  return y;
}

```
      