
## Input

```javascript
// @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import {useState, useRef, useEffect} from 'react';

function Component() {
  const ref = useRef([1, 2, 3, 4, 5]);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const index = 2;
    setValue(ref.current[index]);
  }, []);

  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import { useState, useRef, useEffect } from "react";

function Component() {
  const $ = _c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [1, 2, 3, 4, 5];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const ref = useRef(t0);
  const [value, setValue] = useState(0);
  let t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      setValue(ref.current[2]);
    };
    t2 = [];
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  return value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 3