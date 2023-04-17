
## Input

```javascript
function Component(props) {
  let x = [1, 2, 3];
  let ret = [];
  do {
    let item = x.pop();
    ret.push(item * 2);
  } while (x.length && props.cond);
  return ret;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props;
  let ret;
  if (c_0) {
    const x = [1, 2, 3];
    ret = [];
    do {
      const item = x.pop();
      ret.push(item * 2);
    } while (x.length && props.cond);
    $[0] = props;
    $[1] = ret;
  } else {
    ret = $[1];
  }
  return ret;
}

```
      