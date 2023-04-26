
## Input

```javascript
function Component(props) {
  let x = [0, 1, 2, 3];
  do {
    if (x === 0) {
      break;
    }
    mutate(x);
  } while (props.cond);
  return x;
}

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(props) {
  const $ = useMemoCache(2);
  const c_0 = $[0] !== props;
  let x;
  if (c_0) {
    x = [0, 1, 2, 3];
    do {
      if (x === 0) {
        break;
      }

      mutate(x);
    } while (props.cond);
    $[0] = props;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      