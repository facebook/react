
## Input

```javascript
// @loggerTestOnly @validateNoJSXInTryStatements
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
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateNoJSXInTryStatements
import { identity } from "shared-runtime";

function Component(props) {
  const $ = _c(4);
  let el;
  try {
    let value;
    try {
      let t0;
      if ($[0] !== props.foo) {
        t0 = identity(props.foo);
        $[0] = props.foo;
        $[1] = t0;
      } else {
        t0 = $[1];
      }
      value = t0;
    } catch {
      let t0;
      if ($[2] !== value) {
        t0 = <div value={value} />;
        $[2] = value;
        $[3] = t0;
      } else {
        t0 = $[3];
      }
      el = t0;
    }
  } catch {
    return null;
  }
  return el;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"reason":"Unexpected JSX element within a try statement. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)","description":null,"severity":"InvalidReact","loc":{"start":{"line":11,"column":11,"index":222},"end":{"line":11,"column":32,"index":243},"filename":"invalid-jsx-in-catch-in-outer-try-with-catch.ts"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":4,"column":0,"index":91},"end":{"line":17,"column":1,"index":298},"filename":"invalid-jsx-in-catch-in-outer-try-with-catch.ts"},"fnName":"Component","memoSlots":4,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented