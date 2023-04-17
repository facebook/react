
## Input

```javascript
function Component(props) {
  const x = makeFunction(props);
  const y = x(
    <div>
      <span>{props.text}</span>
    </div>
  );
  return y;
}

```

## Code

```javascript
import * as React from "react";
function Component(props) {
  const $ = React.unstable_useMemoCache(6);
  const c_0 = $[0] !== props;
  let t2;
  if (c_0) {
    const x = makeFunction(props);
    const c_2 = $[2] !== props.text;
    let t0;
    if (c_2) {
      t0 = <span>{props.text}</span>;
      $[2] = props.text;
      $[3] = t0;
    } else {
      t0 = $[3];
    }
    const c_4 = $[4] !== t0;
    let t1;
    if (c_4) {
      t1 = <div>{t0}</div>;
      $[4] = t0;
      $[5] = t1;
    } else {
      t1 = $[5];
    }
    t2 = x(t1);
    $[0] = props;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  const y = t2;
  return y;
}

```
      