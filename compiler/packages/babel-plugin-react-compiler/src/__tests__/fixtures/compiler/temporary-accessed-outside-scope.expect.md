
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let x = props;
  return [x, maybeMutate(maybeMutable)];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);

  const x = props;
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const maybeMutable = new MaybeMutable();
    t0 = maybeMutate(maybeMutable);
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  let t1;
  if ($[1] !== x) {
    t1 = [x, t0];
    $[1] = x;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      