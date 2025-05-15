
## Input

```javascript
// @flow

import {experimental_useEffectEvent, useEffect} from 'react';

component Component(prop: number) {
  const x = experimental_useEffectEvent(() => {
    console.log(prop);
  });
  useEffect(() => x());
  return prop;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prop: 1}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";

import { experimental_useEffectEvent, useEffect } from "react";

function Component(t0) {
  const $ = _c(4);
  const { prop } = t0;
  let t1;
  if ($[0] !== prop) {
    t1 = () => {
      console.log(prop);
    };
    $[0] = prop;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const x = experimental_useEffectEvent(t1);
  let t2;
  if ($[2] !== x) {
    t2 = () => x();
    $[2] = x;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t2);
  return prop;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ prop: 1 }],
};

```
      
### Eval output
(kind: ok) 1
logs: [1]