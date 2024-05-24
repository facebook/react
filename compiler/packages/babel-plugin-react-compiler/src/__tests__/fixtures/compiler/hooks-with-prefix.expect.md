
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
  const $ = _c(6);
  let t0;
  const [state] = React$useState(0);
  const object = Internal$Reassigned$useHook();
  const json = JSON.stringify(object);
  let t1;
  if ($[0] !== state) {
    t0 = makeArray(state);
    const doubledArray = t0;

    t1 = doubledArray.join("");
    $[0] = state;
    $[1] = t1;
    $[2] = t0;
  } else {
    t1 = $[1];
    t0 = $[2];
  }
  let t2;
  if ($[3] !== t1 || $[4] !== json) {
    t2 = (
      <div>
        {t1}
        {json}
      </div>
    );
    $[3] = t1;
    $[4] = json;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>0{"a":0,"b":"value1","c":true}</div>