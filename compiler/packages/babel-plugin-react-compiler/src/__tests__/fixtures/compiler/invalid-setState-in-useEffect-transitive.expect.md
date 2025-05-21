
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInPassiveEffects
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
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoSetStateInPassiveEffects
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
{"kind":"CompileError","detail":{"options":{"reason":"Calling setState directly within a useEffect causes cascading renders and is not recommended. Consider alternatives to useEffect. (https://react.dev/learn/you-might-not-need-an-effect)","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":13,"column":4,"index":272},"end":{"line":13,"column":5,"index":273},"filename":"invalid-setState-in-useEffect-transitive.ts","identifierName":"g"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":99},"end":{"line":16,"column":1,"index":300},"filename":"invalid-setState-in-useEffect-transitive.ts"},"fnName":"Component","memoSlots":2,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented