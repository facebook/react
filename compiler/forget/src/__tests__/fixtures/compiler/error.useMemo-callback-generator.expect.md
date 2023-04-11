
## Input

```javascript
// @inlineUseMemo
function component(a, b) {
  // we don't handle generators at all so this test isn't
  // useful for now, but adding this test in case we do
  // add support for generators in the future.
  let x = useMemo(function* () {
    yield a;
  }, []);
  return x;
}

```


## Error

```
[ReactForget] TodoError: (BuildHIR::lowerExpression) Handle YieldExpression expressions
   5 |   // add support for generators in the future.
   6 |   let x = useMemo(function* () {
>  7 |     yield a;
     |     ^^^^^^^
   8 |   }, []);
   9 |   return x;
  10 | }
```
          
      