
## Input

```javascript
// @hookPattern:".*\b(use[^$]+)$"

import * as React from "react";
import { makeArray, useHook } from "shared-runtime";

const React$useState = React.useState;
const React$useMemo = React.useMemo;
const Internal$Reassigned$useHook = useHook;

function Component() {
  const [state, setState] = React$useState(0);
  const object = Internal$Reassigned$useHook();
  const json = JSON.stringify(object);
  const doubledArray = React$useMemo(() => {
    return makeArray(state);
  }, [state]);
  return (
    <div>
      {doubledArray.join("")}
      {json}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @hookPattern:".*\b(use[^$]+)$"

import * as React from "react";
import { makeArray, useHook } from "shared-runtime";

const React$useState = React.useState;
const React$useMemo = React.useMemo;
const Internal$Reassigned$useHook = useHook;

function Component() {
  const $ = _c(8);

  const t0 = Internal$Reassigned$useHook();
  let t1;
  if ($[0] !== t0) {
    const object = t0;
    t1 = JSON.stringify(object);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  const [state] = React$useState(0);
  const json = t1;
  let t3;
  if ($[2] !== state) {
    t2 = makeArray(state);
    const doubledArray = t2;

    t3 = doubledArray.join("");
    $[2] = state;
    $[3] = t3;
    $[4] = t2;
  } else {
    t3 = $[3];
    t2 = $[4];
  }
  let t4;
  if ($[5] !== t3 || $[6] !== json) {
    t4 = (
      <div>
        {t3}
        {json}
      </div>
    );
    $[5] = t3;
    $[6] = json;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>0{"a":0,"b":"value1","c":true}</div>