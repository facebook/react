
## Input

```javascript
// @hookPattern:".*\b(use[^$]+)$"

import * as React from 'react';
import {makeArray, useHook} from 'shared-runtime';

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
      {doubledArray.join('')}
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
  const $ = _c(7);
  const [state] = React$useState(0);
  const object = Internal$Reassigned$useHook();
  let t0;
  if ($[0] !== object) {
    t0 = JSON.stringify(object);
    $[0] = object;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const json = t0;
  let t1;
  if ($[2] !== state) {
    const doubledArray = makeArray(state);

    t1 = doubledArray.join("");
    $[2] = state;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  let t2;
  if ($[4] !== json || $[5] !== t1) {
    t2 = (
      <div>
        {t1}
        {json}
      </div>
    );
    $[4] = json;
    $[5] = t1;
    $[6] = t2;
  } else {
    t2 = $[6];
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