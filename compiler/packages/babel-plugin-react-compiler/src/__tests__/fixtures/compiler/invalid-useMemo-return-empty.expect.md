
## Input

```javascript
// @loggerTestOnly
function component(a) {
  let x = useMemo(() => {
    mutate(a);
  }, []);
  return x;
}

```

## Code

```javascript
// @loggerTestOnly
function component(a) {
  mutate(a);
}

```

## Logs

```
{"kind":"CompileError","detail":{"options":{"category":"VoidUseMemo","reason":"useMemo() callbacks must return a value","description":"This useMemo() callback doesn't return a value. useMemo() is for computing and caching values, not for arbitrary side effects","suggestions":null,"details":[{"kind":"error","loc":{"start":{"line":3,"column":18,"index":61},"end":{"line":5,"column":3,"index":87},"filename":"invalid-useMemo-return-empty.ts"},"message":"useMemo() callbacks must return a value"}]}},"fnLoc":null}
{"kind":"CompileSuccess","fnLoc":{"start":{"line":2,"column":0,"index":19},"end":{"line":7,"column":1,"index":107},"filename":"invalid-useMemo-return-empty.ts"},"fnName":"component","memoSlots":0,"memoBlocks":0,"memoValues":0,"prunedMemoBlocks":1,"prunedMemoValues":0}
```
      
### Eval output
(kind: exception) Fixture not implemented