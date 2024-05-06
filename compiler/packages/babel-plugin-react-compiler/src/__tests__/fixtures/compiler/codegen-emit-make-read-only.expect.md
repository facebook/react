
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
import { makeReadOnly } from "react-compiler-runtime";
import { c as useMemoCache } from "react/compiler-runtime"; // @enableEmitFreeze true

function MyComponentName(props) {
  const $ = useMemoCache(5);
  let x;
  if ($[0] !== props.a || $[1] !== props.b) {
    x = {};
    foo(x, props.a);
    foo(x, props.b);
    $[0] = props.a;
    $[1] = props.b;
    $[2] = __DEV__ ? makeReadOnly(x, "MyComponentName") : x;
  } else {
    x = $[2];
  }
  let y;
  if ($[3] !== x) {
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
      