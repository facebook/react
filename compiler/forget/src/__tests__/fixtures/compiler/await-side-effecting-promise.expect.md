
## Input

```javascript
async function Component(props) {
  const x = [];
  await populateData(props.id, x);
  return x;
}

```

## Code

```javascript
import * as React from "react";
async function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.id;
  let x;
  if (c_0) {
    x = [];
    await populateData(props.id, x);
    $[0] = props.id;
    $[1] = x;
  } else {
    x = $[1];
  }
  return x;
}

```
      