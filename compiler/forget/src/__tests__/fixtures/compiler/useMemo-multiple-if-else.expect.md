
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
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let t26;
  if (c_0) {
    const y = [];
    if (props.cond) {
      y.push(props.a);
    }
    t26 = undefined;
    if (props.cond2) {
      t26 = y;
    } else {
      y.push(props.b);
      t26 = y;
    }
    $[0] = props;
    $[1] = t26;
  } else {
    t26 = $[1];
  }
  const x = t26;
  return x;
}

```
      