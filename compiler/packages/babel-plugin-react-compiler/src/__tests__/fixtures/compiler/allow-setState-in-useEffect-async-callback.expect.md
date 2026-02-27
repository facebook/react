
## Input

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import {useEffect, useState} from 'react';

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    async function run() {
      await fetch('...');
      setState(s => s + 1);
    }
    run();
  });
  return state;
}

```

## Code

```javascript
// @loggerTestOnly @validateNoSetStateInEffects @outputMode:"lint"
import { useEffect, useState } from "react";

function Component() {
  const [state, setState] = useState(0);
  useEffect(() => {
    async function run() {
      await fetch("...");
      setState((s) => s + 1);
    }
    run();
  });
  return state;
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":111},"end":{"line":14,"column":1,"index":316},"filename":"allow-setState-in-useEffect-async-callback.ts"},"fnName":"Component","memoSlots":1,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented