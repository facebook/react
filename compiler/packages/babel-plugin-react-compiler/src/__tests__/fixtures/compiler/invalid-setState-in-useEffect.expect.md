
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInPassiveEffects
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
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoSetStateInPassiveEffects
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
{"kind":"CompileError","detail":{"options":{"reason":"Calling setState directly within a useEffect causes cascading renders and is not recommended. Consider alternatives to useEffect. (https://react.dev/learn/you-might-not-need-an-effect)","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":7,"column":4,"index":187},"end":{"line":7,"column":12,"index":195},"filename":"invalid-setState-in-useEffect.ts","identifierName":"setState"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":99},"end":{"line":10,"column":1,"index":232},"filename":"invalid-setState-in-useEffect.ts"},"fnName":"Component","memoSlots":1,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented