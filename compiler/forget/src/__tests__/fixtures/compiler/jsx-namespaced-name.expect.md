
## Input

```javascript
function Component(props) {
  return <xml:http protocol:version={props.version} />;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(2);
  const c_0 = $[0] !== props.version;
  let t0;
  if (c_0) {
    t0 = <xml:http protocol:version={props.version} />;
    $[0] = props.version;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      