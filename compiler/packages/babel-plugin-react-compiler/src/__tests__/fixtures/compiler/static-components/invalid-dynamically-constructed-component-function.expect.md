
## Input

```javascript
// @loggerTestOnly @validateStaticComponents
function Example(props) {
  function Component() {
    return <div />;
  }
  return <Component />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateStaticComponents
function Example(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const Component = function Component() {
      return <div />;
    };

    t0 = <Component />;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"reason":"Components created during render will reset their state each time they are created. Declare components outside of render. ","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":6,"column":10,"index":130},"end":{"line":6,"column":19,"index":139},"filename":"invalid-dynamically-constructed-component-function.ts"}}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"reason":"The component may be created during render","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":3,"column":2,"index":73},"end":{"line":5,"column":3,"index":119},"filename":"invalid-dynamically-constructed-component-function.ts"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":2,"column":0,"index":45},"end":{"line":7,"column":1,"index":145},"filename":"invalid-dynamically-constructed-component-function.ts"},"fnName":"Example","memoSlots":1,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented