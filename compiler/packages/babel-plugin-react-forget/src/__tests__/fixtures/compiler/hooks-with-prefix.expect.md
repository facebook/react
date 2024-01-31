
## Input

```javascript
// @hookPattern:"React\$(\w+)"

import * as React from "react";
import { makeArray } from "shared-runtime";

const React$useState = React.useState;
const React$useMemo = React.useMemo;

function Component() {
  const [state, setState] = React$useState(0);
  const doubledArray = React$useMemo(() => {
    return makeArray(state);
  }, [state]);
  return <div>{doubledArray.join("")}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react"; // @hookPattern:"React\$(\w+)"

import * as React from "react";
import { makeArray } from "shared-runtime";

const React$useState = React.useState;
const React$useMemo = React.useMemo;

function Component() {
  const $ = useMemoCache(5);
  const [state] = React$useState(0);
  let t15;
  let t0;
  if ($[0] !== state) {
    t15 = makeArray(state);
    const doubledArray = t15;

    t0 = doubledArray.join("");
    $[0] = state;
    $[1] = t0;
    $[2] = t15;
  } else {
    t0 = $[1];
    t15 = $[2];
  }
  let t1;
  if ($[3] !== t0) {
    t1 = <div>{t0}</div>;
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>0</div>