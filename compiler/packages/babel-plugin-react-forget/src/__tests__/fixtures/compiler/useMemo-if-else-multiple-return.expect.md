
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
  let t20;
  bb7: {
    if (props.cond) {
      let t0;
      if ($[0] !== props.a) {
        t0 = makeObject(props.a);
        $[0] = props.a;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      t20 = t0;
      break bb7;
    }
    let t1;
    if ($[2] !== props.b) {
      t1 = makeObject(props.b);
      $[2] = props.b;
      $[3] = t1;
    } else {
      t1 = $[3];
    }
    t20 = t1;
  }
  const x = t20;
  return x;
}

```
      