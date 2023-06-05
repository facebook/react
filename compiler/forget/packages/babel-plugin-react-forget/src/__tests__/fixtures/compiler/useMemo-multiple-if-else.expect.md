
## Input

```javascript
function Component(props) {
  const x = useMemo(() => {
    let y = [];
    if (props.cond) {
      y.push(props.a);
    }
    if (props.cond2) {
      return y;
    }
    y.push(props.b);
    return y;
  });
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let t32 = undefined;
  bb9: {
    const c_0 = $[0] !== props;
    let y;
    if (c_0) {
      y = [];
      if (props.cond) {
        y.push(props.a);
      }
      if (props.cond2) {
        t32 = y;
        break bb9;
      }

      y.push(props.b);
      $[0] = props;
      $[1] = y;
      $[2] = t32;
    } else {
      y = $[1];
      t32 = $[2];
    }
    t32 = y;
  }
  const x = t32;
  return x;
}

```
      