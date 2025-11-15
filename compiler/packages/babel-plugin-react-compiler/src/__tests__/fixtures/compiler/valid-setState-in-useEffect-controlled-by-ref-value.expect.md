
## Input

```javascript
// @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects @loggerTestOnly
import {useState, useRef, useEffect} from 'react';

function Component({x, y}) {
  const previousXRef = useRef(null);
  const previousYRef = useRef(null);

  const [data, setData] = useState(null);

  useEffect(() => {
    const previousX = previousXRef.current;
    previousXRef.current = x;
    const previousY = previousYRef.current;
    previousYRef.current = y;
    if (!areEqual(x, previousX) || !areEqual(y, previousY)) {
      const data = load({x, y});
      setData(data);
    }
  }, [x, y]);

  return tooltipHeight;
}

function areEqual(a, b) {
  return a === b;
}

function load({x, y}) {
  return x * y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{x: 0, y: 0}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoSetStateInEffects @enableAllowSetStateFromRefsInEffects @loggerTestOnly
import { useState, useRef, useEffect } from "react";

function Component(t0) {
  const $ = _c(4);
  const { x, y } = t0;
  const previousXRef = useRef(null);
  const previousYRef = useRef(null);

  const [, setData] = useState(null);
  let t1;
  let t2;
  if ($[0] !== x || $[1] !== y) {
    t1 = () => {
      const previousX = previousXRef.current;
      previousXRef.current = x;
      const previousY = previousYRef.current;
      previousYRef.current = y;
      if (!areEqual(x, previousX) || !areEqual(y, previousY)) {
        const data_0 = load({ x, y });
        setData(data_0);
      }
    };

    t2 = [x, y];
    $[0] = x;
    $[1] = y;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  return tooltipHeight;
}

function areEqual(a, b) {
  return a === b;
}

function load(t0) {
  const { x, y } = t0;
  return x * y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 0, y: 0 }],
};

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"EffectSetState","reason":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":17,"column":6,"index":554},"end":{"line":17,"column":13,"index":561},"filename":"valid-setState-in-useEffect-controlled-by-ref-value.ts","identifierName":"setData"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":138},"end":{"line":22,"column":1,"index":615},"filename":"valid-setState-in-useEffect-controlled-by-ref-value.ts"},"fnName":"Component","memoSlots":4,"memoBlocks":1,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":24,"column":0,"index":617},"end":{"line":26,"column":1,"index":662},"filename":"valid-setState-in-useEffect-controlled-by-ref-value.ts"},"fnName":"areEqual","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":28,"column":0,"index":664},"end":{"line":30,"column":1,"index":705},"filename":"valid-setState-in-useEffect-controlled-by-ref-value.ts"},"fnName":"load","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) tooltipHeight is not defined