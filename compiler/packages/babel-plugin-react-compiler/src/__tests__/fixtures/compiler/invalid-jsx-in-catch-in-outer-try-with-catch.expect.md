
## Input

```javascript
// @loggerTestOnly @validateNoJSXInTryStatements @outputMode:"lint"
import {identity} from 'shared-runtime';

function Component(props) {
  let el;
  try {
    let value;
    try {
      value = identity(props.foo);
    } catch {
      el = <div value={value} />;
    }
  } catch {
    return null;
  }
  return el;
}

```

## Code

```javascript
// @loggerTestOnly @validateNoJSXInTryStatements @outputMode:"lint"
import { identity } from "shared-runtime";

function Component(props) {
  let el;
  try {
    let value;
    try {
      value = identity(props.foo);
    } catch {
      el = <div value={value} />;
    }
  } catch {
    return null;
  }
  return el;
}

```

## Logs

```
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":110},"end":{"line":17,"column":1,"index":317},"filename":"invalid-jsx-in-catch-in-outer-try-with-catch.ts"},"fnName":"Component","memoSlots":4,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented