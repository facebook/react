
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import React, {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    setState(s => s + 1);
  });
  React.useEffect(() => {
    setState(s => s + 1);
  });
  return state;
}

```

## Code

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import React, { useEffect, useState } from "react";

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    setState((s) => s + 1);
  });
  React.useEffect(() => {
    setState((s_0) => s_0 + 1);
  });
  return state;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"EffectSetState","reason":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":7,"column":4,"index":206},"end":{"line":7,"column":12,"index":214},"filename":"invalid-setState-in-useEffect.ts","identifierName":"setState"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"category":"EffectSetState","reason":"Calling setState synchronously within an effect can trigger cascading renders","description":"Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:\n* Update external systems with the latest state from React.\n* Subscribe for updates from some external system, calling setState in a callback function when external state changes.\n\nCalling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect)","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":10,"column":4,"index":264},"end":{"line":10,"column":12,"index":272},"filename":"invalid-setState-in-useEffect.ts","identifierName":"setState"},"message":"Avoid calling setState() directly within an effect"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":118},"end":{"line":13,"column":1,"index":309},"filename":"invalid-setState-in-useEffect.ts"},"fnName":"Component","memoSlots":2,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented