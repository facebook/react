
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  } else {
    x = [];
    x = [];
    x.push(props.bar);
  }
  mut(x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(props) {
  const $ = _c(4);
  let x;
  if ($[0] !== props.bar || $[1] !== props.cond || $[2] !== props.foo) {
    x = [];
    x.push(props.bar);
    if (props.cond) {
      x = [];
      x.push(props.foo);
    } else {
      x = [];
      x.push(props.bar);
    }

    mut(x);
    $[0] = props.bar;
    $[1] = props.cond;
    $[2] = props.foo;
    $[3] = x;
  } else {
    x = $[3];
  }
  return x;
}

```
      