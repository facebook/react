
## Input

```javascript
// @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import {useState, useRef, useLayoutEffect} from 'react';

function Tooltip() {
  const ref = useRef(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);

  useLayoutEffect(() => {
    const {height} = ref.current.getBoundingClientRect();
    setTooltipHeight(height);
  }, []);

  return tooltipHeight;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Tooltip,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects
import { useState, useRef, useLayoutEffect } from "react";

function Tooltip() {
  const $ = _c(2);
  const ref = useRef(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      const { height } = ref.current.getBoundingClientRect();
      setTooltipHeight(height);
    };
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  useLayoutEffect(t0, t1);
  return tooltipHeight;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Tooltip,
  params: [],
};

```
      
### Eval output
(kind: exception) Cannot read properties of null (reading 'getBoundingClientRect')