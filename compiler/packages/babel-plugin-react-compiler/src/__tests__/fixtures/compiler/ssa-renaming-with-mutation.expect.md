
## Input

```javascript
function foo(props) {
  let x = [];
  x.push(props.bar);
  if (props.cond) {
    x = {};
    x = [];
    x.push(props.foo);
  }
  mut(x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function foo(props) {
  const $ = _c(2);
  let x;
  if ($[0] !== props) {
    x = [];
    x.push(props.bar);
    if (props.cond) {
      x = [];
      x.push(props.foo);
    }

    mut(x);
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      