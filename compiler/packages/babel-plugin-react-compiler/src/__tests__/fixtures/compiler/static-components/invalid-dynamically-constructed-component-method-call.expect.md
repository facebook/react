
## Input

```javascript
// @loggerTestOnly @validateStaticComponents
function Example(props) {
  const Component = props.foo.bar();
  return <Component />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @loggerTestOnly @validateStaticComponents
function Example(props) {
  const $ = _c(4);
  let t0;
  if ($[0] !== props.foo) {
    t0 = props.foo.bar();
    $[0] = props.foo;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const Component = t0;
  let t1;
  if ($[2] !== Component) {
    t1 = <Component />;
    $[2] = Component;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  return t1;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"reason":"Components created during render will reset their state each time they are created. Declare components outside of render. ","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":4,"column":10,"index":118},"end":{"line":4,"column":19,"index":127},"filename":"invalid-dynamically-constructed-component-method-call.ts"}}},"fnLoc":null}
{"kind":"CompileError","detail":{"options":{"reason":"The component may be created during render","description":null,"severity":"InvalidReact","suggestions":null,"loc":{"start":{"line":3,"column":20,"index":91},"end":{"line":3,"column":35,"index":106},"filename":"invalid-dynamically-constructed-component-method-call.ts"}}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":2,"column":0,"index":45},"end":{"line":5,"column":1,"index":133},"filename":"invalid-dynamically-constructed-component-method-call.ts"},"fnName":"Example","memoSlots":4,"memoBlocks":2,"memoValues":2,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented