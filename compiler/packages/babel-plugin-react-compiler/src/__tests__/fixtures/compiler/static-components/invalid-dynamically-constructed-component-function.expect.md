
## Input

```javascript
// @loggerTestOnly @validateStaticComponents @outputMode:"lint"
function Example(props) {
  function Component() {
    return <div />;
  }
  return <Component />;
}

```

## Code

```javascript
// @loggerTestOnly @validateStaticComponents @outputMode:"lint"
function Example(props) {
  function Component() {
    return <div />;
  }
  return <Component />;
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"StaticComponents","reason":"Cannot create components during render","description":"Components created during render will reset their state each time they are created. Declare components outside of render","details":[{"kind":"error","loc":{"start":{"line":6,"column":10,"index":154},"end":{"line":6,"column":19,"index":163},"filename":"invalid-dynamically-constructed-component-function.ts"},"message":"This component is created during render"},{"kind":"error","loc":{"start":{"line":3,"column":2,"index":94},"end":{"line":5,"column":3,"index":142},"filename":"invalid-dynamically-constructed-component-function.ts"},"message":"The component is created during render here"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":2,"column":0,"index":65},"end":{"line":7,"column":1,"index":170},"filename":"invalid-dynamically-constructed-component-function.ts"},"fnName":"Example","memoSlots":1,"memoBlocks":1,"memoValues":1,"prunedMemoBlocks":0,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented