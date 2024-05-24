
## Input

```javascript
function Component(props) {
  const mutate = (object, key, value) => {
    object.updated = true;
    object[key] = value;
  };
  const x = makeObject(props);
  mutate(x);
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(3);
  let t0;
  if ($[0] !== props) {
    const x = makeObject(props);

    t0 = x;
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (object, key, value) => {
        object.updated = true;
        object[key] = value;
      };
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    const mutate = t1;
    mutate(x);
    $[0] = props;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      