
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects
import {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  const f = () => {
    setState(s => s + 1);
  };
  const g = () => {
    f();
  };
  useEffect(() => {
    g();
  });
  return state;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoSetStateInEffects
import { useEffect, useState } from "react";

function Component() {
  const $ = _c(2);
  const [state, setState] = useState(0);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const f = () => {
      setState(_temp);
    };

    t0 = () => {
      f();
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const g = t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = () => {
      g();
    };
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  useEffect(t1);
  return state;
}
function _temp(s) {
  return s + 1;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)","severity":"InvalidReact","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":13,"column":4,"index":265},"end":{"line":13,"column":5,"index":266},"filename":"invalid-setState-in-useEffect-transitive.ts","identifierName":"g"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":92},"end":{"line":16,"column":1,"index":293},"filename":"invalid-setState-in-useEffect-transitive.ts"},"fnName":"Component","memoSlots":2,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented