
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
import { c as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(6);
  let x;
  let y;
  if ($[0] !== props) {
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
  let t0;
  if ($[3] !== x || $[4] !== y) {
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
      