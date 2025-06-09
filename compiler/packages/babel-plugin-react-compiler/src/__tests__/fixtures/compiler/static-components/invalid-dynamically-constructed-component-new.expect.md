
## Input

```javascript
// @loggerTestOnly @validateStaticComponents
function Example(props) {
  const Component = new ComponentFactory();
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
    const Component = new ComponentFactory();
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
{"kind":"CompileError","detail":{"options":{"reason":"Components created during render will reset their state each time they are created. Declare components outside of render. ","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":4,"column":10,"index":125},"end":{"line":4,"column":19,"index":134},"filename":"invalid-dynamically-constructed-component-new.ts"}}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"reason":"The component may be created during render","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":3,"column":20,"index":91},"end":{"line":3,"column":42,"index":113},"filename":"invalid-dynamically-constructed-component-new.ts"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":2,"column":0,"index":45},"end":{"line":5,"column":1,"index":140},"filename":"invalid-dynamically-constructed-component-new.ts"},"fnName":"Example","memoSlots":1,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented