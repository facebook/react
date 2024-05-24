
## Input

```javascript
function Component(props) {
  const x = [];
  x.push(props.value);
  const { length: y } = x;
  foo(y);
  return [x, y];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let t0;
  if ($[0] !== props.value) {
    const x = [];

    const { length: y } = x;

    t0 = [x, y];
    x.push(props.value);
    foo(y);
    $[0] = props.value;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      