
## Input

```javascript
import {useState} from 'react';
import {useIdentity} from 'shared-runtime';
function useMakeCallback({obj}: {obj: {value: number}}) {
  const [state, setState] = useState(0);
  const cb = () => setState(obj.value);
  useIdentity();
  if (state === 0 && obj.value !== 0) {
    cb();
  }
  return cb;
}
export const FIXTURE_ENTRYPOINT = {
  fn: useMakeCallback,
  params: [{obj: {value: 1}}],
  sequentialRenders: [{obj: {value: 1}}, {obj: {value: 2}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";
import { useIdentity } from "shared-runtime";
function useMakeCallback(t0) {
  const $ = _c(2);
  const { obj } = t0;
  const [state, setState] = useState(0);
  let t1;
  if ($[0] !== obj.value) {
    t1 = () => setState(obj.value);
    $[0] = obj.value;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const cb = t1;
  useIdentity();
  if (state === 0 && obj.value !== 0) {
    cb();
  }
  return cb;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMakeCallback,
  params: [{ obj: { value: 1 } }],
  sequentialRenders: [{ obj: { value: 1 } }, { obj: { value: 2 } }],
};

```
      
### Eval output
(kind: ok) "[[ function params=0 ]]"
"[[ function params=0 ]]"