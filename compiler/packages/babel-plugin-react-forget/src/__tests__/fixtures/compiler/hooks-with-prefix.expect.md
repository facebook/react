
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
import { unstable_useMemoCache as useMemoCache } from "react"; // @hookPattern:".*\b(use[^$]+)$"

import * as React from "react";
import { makeArray, useHook } from "shared-runtime";

const React$useState = React.useState;
const React$useMemo = React.useMemo;
const Internal$Reassigned$useHook = useHook;

function Component() {
  const $ = useMemoCache(6);
  const [state] = React$useState(0);
  const object = Internal$Reassigned$useHook();
  const json = JSON.stringify(object);
  let t25;
  let t0;
  if ($[0] !== state) {
    t25 = makeArray(state);
    const doubledArray = t25;

    t0 = doubledArray.join("");
    $[0] = state;
    $[1] = t0;
    $[2] = t25;
  } else {
    t0 = $[1];
    t25 = $[2];
  }
  let t1;
  if ($[3] !== t0 || $[4] !== json) {
    t1 = (
      <div>
        {t0}
        {json}
      </div>
    );
    $[3] = t0;
    $[4] = json;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>0{"a":0,"b":"value1","c":true}</div>