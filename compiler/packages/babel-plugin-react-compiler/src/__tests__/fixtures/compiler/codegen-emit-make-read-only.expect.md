
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
  let y;
  if ($[0] !== props.a || $[1] !== props.b) {
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
      