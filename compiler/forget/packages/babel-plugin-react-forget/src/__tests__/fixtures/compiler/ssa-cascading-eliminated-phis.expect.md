
## Input

```javascript
function Component(props) {
  let x = 0;
  const values = [];
  const y = props.a || props.b;
  values.push(y);
  if (props.c) {
    x = 1;
  }
  values.push(x);
  if (props.d) {
    x = 2;
  }
  values.push(x);
  return values;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(3);
  let x = 0;
  const c_0 = $[0] !== props;
  let values;
  if (c_0) {
    values = [];
    const y = props.a || props.b;
    values.push(y);
    if (props.c) {
      x = 1;
    }

    values.push(x);
    if (props.d) {
      x = 2;
    }

    values.push(x);
    $[0] = props;
    $[1] = values;
    $[2] = x;
  } else {
    values = $[1];
    x = $[2];
  }
  return values;
}

```
      