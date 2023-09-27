
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
import { makeReadOnly } from "react-forget-runtime";
import { unstable_useMemoCache as useMemoCache } from "react"; // @enableEmitFreeze true

function MyComponentName(props) {
  const $ = useMemoCache(3);
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  let y;
  if (c_0 || c_1) {
    const x = {};
    foo(x, props.a);
    foo(x, props.b);

    y = [];
    y.push(x);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = __DEV__ ? makeReadOnly(y, "MyComponentName") : y;
  } else {
    y = $[2];
  }
  return y;
}

```
      