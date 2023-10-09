
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
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(4);
  let t44;
  bb8: {
    if (props.cond) {
      const c_0 = $[0] !== props.a;
      let t0;
      if (c_0) {
        t0 = makeObject(props.a);
        $[0] = props.a;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      t44 = t0;
      break bb8;
    }
    const c_2 = $[2] !== props.b;
    let t1;
    if (c_2) {
      t1 = makeObject(props.b);
      $[2] = props.b;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    t44 = t1;
  }
  const x = t44;
  return x;
}

```
      