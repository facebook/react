
## Input

```javascript
// @loggerTestOnly @validateStaticComponents
function Example(props) {
  let Component;
  if (props.cond) {
    Component = createComponent();
  } else {
    Component = DefaultComponent;
  }
  return <Component />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateStaticComponents
function Example(props) {
  const $ = _c(3);
  let Component;
  if (props.cond) {
    let t0;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      t0 = createComponent();
      $[0] = t0;
    } else {
      t0 = $[0];
    }
    Component = t0;
  } else {
    Component = DefaultComponent;
  }
  let t0;
  if ($[1] !== Component) {
    t0 = <Component />;
    $[1] = Component;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"reason":"Components created during render will reset their state each time they are created. Declare components outside of render. ","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":9,"column":10,"index":202},"end":{"line":9,"column":19,"index":211},"filename":"invalid-conditionally-assigned-dynamically-constructed-component-in-render.ts"}}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"reason":"The component may be created during render","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":5,"column":16,"index":124},"end":{"line":5,"column":33,"index":141},"filename":"invalid-conditionally-assigned-dynamically-constructed-component-in-render.ts"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":2,"column":0,"index":45},"end":{"line":10,"column":1,"index":217},"filename":"invalid-conditionally-assigned-dynamically-constructed-component-in-render.ts"},"fnName":"Example","memoSlots":3,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented