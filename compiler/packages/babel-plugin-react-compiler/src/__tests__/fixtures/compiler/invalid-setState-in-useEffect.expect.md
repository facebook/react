
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects
import {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    setState(s => s + 1);
  });
  return state;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoSetStateInEffects
import { useEffect, useState } from "react";

function Component() {
  const $ = _c(1);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      setState(_temp);
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  useEffect(t0);
  return state;
}
function _temp(s) {
  return s + 1;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)","severity":"InvalidReact","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":7,"column":4,"index":180},"end":{"line":7,"column":12,"index":188},"filename":"invalid-setState-in-useEffect.ts","identifierName":"setState"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":92},"end":{"line":10,"column":1,"index":225},"filename":"invalid-setState-in-useEffect.ts"},"fnName":"Component","memoSlots":1,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented