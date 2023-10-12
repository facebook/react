
## Input

```javascript
import fbt from "fbt";

function Component(props) {
  const text = fbt(
    `${fbt.param("(key) count", props.count)} items`,
    "(description) Number of items"
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
  if ($[0] !== props.count) {
    t0 = fbt._(
      "{(key) count} items",
      [fbt._param("(key) count", props.count)],
      { hk: "3yW91j" }
    );
    $[0] = props.count;
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
      