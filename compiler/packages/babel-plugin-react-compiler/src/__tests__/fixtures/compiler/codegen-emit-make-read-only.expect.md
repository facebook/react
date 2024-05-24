
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
import { c as _c } from "react/compiler-runtime"; // @enableEmitFreeze true

function MyComponentName(props) {
  const $ = _c(3);
  let t0;
  if ($[0] !== props.b || $[1] !== props.a) {
    const y = [];

    t0 = y;
    const x = {};
    y.push(x);
    foo(x, props.b);
    foo(x, props.a);
    $[0] = props.b;
    $[1] = props.a;
    $[2] = __DEV__ ? makeReadOnly(t0, "MyComponentName") : t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      