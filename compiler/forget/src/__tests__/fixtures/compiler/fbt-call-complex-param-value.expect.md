
## Input

```javascript
import fbt from "fbt";

function Component(props) {
  const text = fbt(
    `Hello, ${fbt.param("(key) name", capitalize(props.name))}!`,
    "(description) Greeting"
  );
  return <div>{text}</div>;
}

```

## Code

```javascript
import * as React from "react";
import fbt from "fbt";

function Component(props) {
  const $ = React.unstable_useMemoCache(4);
  const c_0 = $[0] !== props.name;
  let t0;
  if (c_0) {
    t0 = fbt._(
      "Hello, {(key) name}!",
      [fbt._param("(key) name", capitalize(props.name))],
      { hk: "2sOsn5" }
    );
    $[0] = props.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const text = t0;
  const c_2 = $[2] !== text;
  let t1;
  if (c_2) {
    t1 = <div>{text}</div>;
    $[2] = text;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      