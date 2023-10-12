
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
import { unstable_useMemoCache as useMemoCache } from "react";
import fbt from "fbt";

function Component(props) {
  const $ = useMemoCache(4);
  let t0;
  if ($[0] !== props.name) {
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
  let t1;
  if ($[2] !== text) {
    t1 = <div>{text}</div>;
    $[2] = text;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```
      