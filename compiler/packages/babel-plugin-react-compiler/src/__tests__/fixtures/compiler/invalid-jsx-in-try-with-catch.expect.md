
## Input

```javascript
// @loggerTestOnly @validateNoJSXInTryStatements
function Component(props) {
  let el;
  try {
    el = <div />;
  } catch {
    return null;
  }
  return el;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoJSXInTryStatements
function Component(props) {
  const $ = _c(1);
  let el;
  try {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = <div />;
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    el = t0;
  } catch {
    return null;
  }
  return el;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"reason":"Unexpected JSX element within a try statement. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)","description":null,"severity":"InvalidReact","loc":{"start":{"line":5,"column":9,"index":104},"end":{"line":5,"column":16,"index":111},"filename":"invalid-jsx-in-try-with-catch.ts"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":2,"column":0,"index":49},"end":{"line":10,"column":1,"index":160},"filename":"invalid-jsx-in-try-with-catch.ts"},"fnName":"Component","memoSlots":1,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented