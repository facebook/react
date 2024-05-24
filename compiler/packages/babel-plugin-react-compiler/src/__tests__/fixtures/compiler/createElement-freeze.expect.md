
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
import { c as _c } from "react/compiler-runtime";
import React from "react";
import { shallowCopy } from "shared-runtime";

function Component(props) {
  const $ = _c(6);
  let t0;
  let childProps;
  if ($[0] !== props.width) {
    const t1 = { width: props.width };
    let t2;
    if ($[3] !== t1) {
      t2 = { style: t1 };
      $[3] = t1;
      $[4] = t2;
    } else {
      t2 = $[4];
    }
    childProps = t2;
    let t3;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
      t3 = ["hello world"];
      $[5] = t3;
    } else {
      t3 = $[5];
    }
    t0 = React.createElement("div", childProps, t3);
    $[0] = props.width;
    $[1] = t0;
    $[2] = childProps;
  } else {
    t0 = $[1];
    childProps = $[2];
  }
  const element = t0;
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