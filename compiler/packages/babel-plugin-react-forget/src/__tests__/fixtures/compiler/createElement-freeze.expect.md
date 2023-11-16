
## Input

```javascript
import React from "react";
import { shallowCopy } from "shared-runtime";

function Component(props) {
  const childProps = { style: { width: props.width } };
  const element = React.createElement("div", childProps, ["hello world"]);
  shallowCopy(childProps); // function that in theory could mutate, we assume not bc createElement freezes
  return element;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import React from "react";
import { shallowCopy } from "shared-runtime";

function Component(props) {
  const $ = useMemoCache(5);
  let t0;
  if ($[0] !== props.width) {
    t0 = { style: { width: props.width } };
    $[0] = props.width;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const childProps = t0;
  let t2;
  if ($[2] !== childProps) {
    let t1;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = ["hello world"];
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    t2 = React.createElement("div", childProps, t1);
    $[2] = childProps;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const element = t2;
  shallowCopy(childProps);
  return element;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>hello world</div>