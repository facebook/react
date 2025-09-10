
## Input

```javascript
// @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import {useState, useRef, useLayoutEffect} from 'react';

function Component() {
  const ref = useRef({size: 5});
  const [computedSize, setComputedSize] = useState(0);

  useLayoutEffect(() => {
    setComputedSize(ref.current.size * 10);
  }, []);

  return computedSize;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import { useState, useRef, useLayoutEffect } from "react";

function Component() {
  const $ = _c(3);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = { size: 5 };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const ref = useRef(t0);
  const [computedSize, setComputedSize] = useState(0);
  let t1;
  let t2;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      setComputedSize(ref.current.size * 10);
    };
    t2 = [];
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useLayoutEffect(t1, t2);
  return computedSize;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: ok) 50