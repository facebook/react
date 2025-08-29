
## Input

```javascript
function Component(props) {
  const x = useMemo(() => {
    if (props.cond) {
      return makeObject(props.a);
    }
    return makeObject(props.b);
  });
  return x;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(6);
  let t0;
  if ($[0] !== props.a || $[1] !== props.b || $[2] !== props.cond) {
    bb0: {
      if (props.cond) {
        t0 = makeObject(props.a);
        break bb0;
      }
      let t1;
      if ($[4] !== props.b) {
        t1 = makeObject(props.b);
        $[4] = props.b;
        $[5] = t1;
      } else {
        t1 = $[5];
      }
      t0 = t1;
    }
    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.cond;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const x = t0;
  return x;
}

```
      