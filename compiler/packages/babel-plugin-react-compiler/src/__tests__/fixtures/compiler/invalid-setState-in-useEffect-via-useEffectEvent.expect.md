
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects
import {useEffect, useEffectEvent, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  const effectEvent = useEffectEvent(() => {
    setState(true);
  });
  useEffect(() => {
    effectEvent();
  }, []);
  return state;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoSetStateInEffects
import { useEffect, useEffectEvent, useState } from "react";

function Component() {
  const $ = _c(4);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      setState(true);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const effectEvent = useEffectEvent(t0);
  let t1;
  if ($[1] !== effectEvent) {
    t1 = () => {
      effectEvent();
    };
    $[1] = effectEvent;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = [];
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  useEffect(t1, t2);
  return state;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"EffectSetState","reason":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":10,"column":4,"index":267},"end":{"line":10,"column":15,"index":278},"filename":"invalid-setState-in-useEffect-via-useEffectEvent.ts","identifierName":"effectEvent"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":108},"end":{"line":13,"column":1,"index":309},"filename":"invalid-setState-in-useEffect-via-useEffectEvent.ts"},"fnName":"Component","memoSlots":4,"memoBlocks":3,"memoValues":3,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented