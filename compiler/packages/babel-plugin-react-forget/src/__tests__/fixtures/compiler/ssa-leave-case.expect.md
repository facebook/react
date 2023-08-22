
## Input

```javascript
function Component(props) {
  let x = [];
  let y;
  if (props.p0) {
    x.push(props.p1);
    y = x;
  }
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
  const c_0 = $[0] !== props;
  let x;
  let y;
  if (c_0) {
    x = [];
    if (props.p0) {
      x.push(props.p1);
      y = x;
    }
    $[0] = props;
    $[1] = x;
    $[2] = y;
  } else {
    x = $[1];
    y = $[2];
  }
  const c_3 = $[3] !== x;
  const c_4 = $[4] !== y;
  let t0;
  if (c_3 || c_4) {
    t0 = (
      <Component>
        {x}
        {y}
      </Component>
    );
    $[3] = x;
    $[4] = y;
    $[5] = t0;
  } else {
    t0 = $[5];
  }
  return t0;
}

```
      