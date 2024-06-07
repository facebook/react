
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let x = props.value;
  return [x, maybeMutate(maybeMutable)];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(6);
  let x;
  let t0;
  if ($[0] !== props.value) {
    const maybeMutable = new MaybeMutable();
    x = props.value;
    t0 = maybeMutate(maybeMutable);
    $[0] = props.value;
    $[1] = x;
    $[2] = t0;
  } else {
    x = $[1];
    t0 = $[2];
  }
  let t1;
  if ($[3] !== x || $[4] !== t0) {
    t1 = [x, t0];
    $[3] = x;
    $[4] = t0;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

```
      